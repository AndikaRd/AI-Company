import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, realpathSync } from 'fs';
import { spawn } from 'child_process';

export class WorkspaceSecurityException extends Error {
  constructor(message: string) {
    super(`[WorkspaceSecurityException] ${message}`);
    this.name = 'WorkspaceSecurityException';
  }
}

export interface CommandExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export class WorkspaceSandbox {
  private readonly workspaceRoot: string;
  private readonly realWorkspaceRoot: string;
  private readonly maxFileSizeBytes: number;
  private readonly defaultTimeoutMs: number;

  private static readonly FORBIDDEN_PATTERNS = [
    /\.env($|\..+)/i,
    /id_rsa($|\..+)/i,
    /id_dsa($|\..+)/i,
    /id_ecdsa($|\..+)/i,
    /id_ed25519($|\..+)/i,
    /\.pem$/i,
    /\.key$/i,
    /\.pfx$/i,
    /\.p12$/i,
    /secret/i,
    /credential/i,
    /\.token($|\..+)/i,
    /\.aws/i,
    /\.gitconfig/i,
    /passwd$/i,
    /shadow$/i,
  ];

  private static readonly FORBIDDEN_COMMANDS = [
    /rm\s+-rf\s+\/|rmdir\s+\/s\s+\/q\s+[c-z]:\\/i,
    /format\s+[c-z]:/i,
    /shutdown/i,
    /mkfs/i,
    /dd\s+if=/i,
    /curl.*\|\s*(bash|sh|pwsh|cmd)/i,
    /wget.*\|\s*(bash|sh|pwsh|cmd)/i,
    /powershell.*-enc/i,
    /reg\s+(delete|add)/i,
  ];

  constructor(workspaceRoot: string, options?: { maxFileSizeBytes?: number; defaultTimeoutMs?: number }) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.realWorkspaceRoot = existsSync(this.workspaceRoot)
      ? realpathSync(this.workspaceRoot)
      : this.workspaceRoot;
    this.maxFileSizeBytes = options?.maxFileSizeBytes ?? 2 * 1024 * 1024; // 2 MB
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 45 * 1000; // 45s
  }

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  getRealWorkspaceRoot(): string {
    return this.realWorkspaceRoot;
  }

  /**
   * Resolves a target path against the authorized workspace root.
   * Enforces strict containment, symlink escape prevention, and sensitive pattern protection.
   */
  resolveSafePath(targetPath: string): string {
    if (!targetPath || typeof targetPath !== 'string') {
      return this.workspaceRoot;
    }

    let resolvedPath: string;

    // Check for absolute paths
    if (path.isAbsolute(targetPath)) {
      const normalizedAbsolute = path.normalize(targetPath);
      const normalizedRoot = path.normalize(this.workspaceRoot);
      if (!normalizedAbsolute.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
        throw new WorkspaceSecurityException(
          `Unauthorized absolute path rejected: '${targetPath}' is outside the authorized workspace '${this.workspaceRoot}'.`,
        );
      }
      resolvedPath = normalizedAbsolute;
    } else {
      // Relative path: clean leading slashes and resolve against workspace root
      const sanitized = targetPath.replace(/^[/\\]+/, '');
      resolvedPath = path.resolve(this.workspaceRoot, sanitized);
    }

    // Verify canonical path begins strictly with the authorized workspace root
    const normalizedRoot = path.normalize(this.workspaceRoot).toLowerCase();
    const normalizedTarget = path.normalize(resolvedPath).toLowerCase();

    if (!normalizedTarget.startsWith(normalizedRoot)) {
      throw new WorkspaceSecurityException(
        `Path traversal detected! Attempted to access '${targetPath}' outside authorized workspace '${this.workspaceRoot}'.`,
      );
    }

    // Check all segments for forbidden secret files / credential patterns
    const relativeSegments = path.relative(this.workspaceRoot, resolvedPath).split(/[/\\]/);
    const basename = path.basename(resolvedPath);

    for (const segment of [...relativeSegments, basename]) {
      if (!segment) continue;
      for (const pattern of WorkspaceSandbox.FORBIDDEN_PATTERNS) {
        if (pattern.test(segment)) {
          throw new WorkspaceSecurityException(
            `Access to sensitive file pattern '${segment}' is strictly blocked for AI runtime security.`,
          );
        }
      }
    }

    // Prevent Symlink Escapes
    if (existsSync(resolvedPath)) {
      try {
        const realTarget = realpathSync(resolvedPath);
        if (!realTarget.toLowerCase().startsWith(this.realWorkspaceRoot.toLowerCase())) {
          throw new WorkspaceSecurityException(
            `Symlink escape detected! Path '${targetPath}' points outside authorized workspace to '${realTarget}'.`,
          );
        }
      } catch (err) {
        if (err instanceof WorkspaceSecurityException) throw err;
      }
    } else {
      // For paths that do not exist yet (e.g. creating new file), verify parent directory
      let currentDir = path.dirname(resolvedPath);
      while (currentDir && !existsSync(currentDir) && currentDir !== path.dirname(currentDir)) {
        currentDir = path.dirname(currentDir);
      }
      if (existsSync(currentDir)) {
        const realParent = realpathSync(currentDir);
        if (!realParent.toLowerCase().startsWith(this.realWorkspaceRoot.toLowerCase())) {
          throw new WorkspaceSecurityException(
            `Symlink escape detected! Parent directory resolves outside authorized workspace to '${realParent}'.`,
          );
        }
      }
    }

    return resolvedPath;
  }

  /**
   * Validates file size for reading/writing
   */
  async validateFileSize(filePath: string): Promise<void> {
    if (existsSync(filePath)) {
      const stat = await fs.stat(filePath);
      if (stat.size > this.maxFileSizeBytes) {
        throw new WorkspaceSecurityException(
          `File size (${(stat.size / 1024).toFixed(1)} KB) exceeds the maximum allowed limit of ${(this.maxFileSizeBytes / 1024).toFixed(1)} KB.`,
        );
      }
    }
  }

  /**
   * Executes a command inside the workspace directory in an isolated child process
   */
  async executeCommand(
    commandLine: string,
    options?: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv },
  ): Promise<CommandExecutionResult> {
    const cwd = options?.cwd ? this.resolveSafePath(options.cwd) : this.workspaceRoot;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const startTime = Date.now();

    // Guard against dangerous destructive commands
    for (const pattern of WorkspaceSandbox.FORBIDDEN_COMMANDS) {
      if (pattern.test(commandLine)) {
        throw new WorkspaceSecurityException(
          `Command contains potentially destructive shell instruction matching security blacklist.`,
        );
      }
    }

    // Build safe, isolated environment (redacting backend secrets)
    const safeEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || process.env.Path,
      Path: process.env.Path || process.env.PATH,
      SYSTEMROOT: process.env.SYSTEMROOT,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      NODE_ENV: 'test',
      CI: 'true',
      ...options?.env,
    };

    // Remove backend credentials from child process
    const sensitiveKeys = ['DATABASE_URL', 'POSTGRES_PASSWORD', 'PASSWORD', 'JWT_SECRET', 'SECRET', 'TOKEN', 'API_KEY'];
    for (const key of Object.keys(safeEnv)) {
      if (sensitiveKeys.some((s) => key.toUpperCase().includes(s))) {
        delete safeEnv[key];
      }
    }

    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const shellCmd = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/d', '/s', '/c', commandLine] : ['-c', commandLine];

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const child = spawn(shellCmd, shellArgs, {
        cwd,
        env: safeEnv,
        windowsVerbatimArguments: true,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        if (isWindows && child.pid) {
          try {
            spawn('taskkill', ['/pid', child.pid.toString(), '/t', '/f']);
          } catch {
            child.kill('SIGKILL');
          }
        } else {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) child.kill('SIGKILL');
          }, 1000);
        }
      }, timeoutMs);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > 500000) {
          stdout = stdout.slice(-500000); // Truncate extreme output buffer
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > 200000) {
          stderr = stderr.slice(-200000);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        if (isTimedOut) {
          resolve({
            exitCode: -1,
            stdout,
            stderr: `${stderr}\n[Security Error]: Process timed out after ${timeoutMs / 1000} seconds.`,
            durationMs,
          });
        } else {
          resolve({
            exitCode: code ?? 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            durationMs,
          });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          exitCode: 1,
          stdout,
          stderr: `Process spawn error: ${err.message}`,
          durationMs: Date.now() - startTime,
        });
      });
    });
  }
}
