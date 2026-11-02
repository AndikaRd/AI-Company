import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
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
  ];

  constructor(workspaceRoot: string, options?: { maxFileSizeBytes?: number; defaultTimeoutMs?: number }) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.maxFileSizeBytes = options?.maxFileSizeBytes ?? 2 * 1024 * 1024; // 2 MB
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 45 * 1000; // 45s
  }

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Resolves a target relative path against the authorized workspace root.
   * Enforces strict containment and path traversal protection.
   */
  resolveSafePath(targetRelativeOrSubPath: string): string {
    if (!targetRelativeOrSubPath || typeof targetRelativeOrSubPath !== 'string') {
      return this.workspaceRoot;
    }

    // Clean leading slashes / backslashes
    const sanitized = targetRelativeOrSubPath.replace(/^[/\\]+/, '');
    const resolvedPath = path.resolve(this.workspaceRoot, sanitized);

    // Verify canonical path begins strictly with the authorized workspace root
    const normalizedRoot = path.normalize(this.workspaceRoot).toLowerCase();
    const normalizedTarget = path.normalize(resolvedPath).toLowerCase();

    if (!normalizedTarget.startsWith(normalizedRoot)) {
      throw new WorkspaceSecurityException(
        `Path traversal detected! Attempted to access '${targetRelativeOrSubPath}' outside authorized workspace '${this.workspaceRoot}'.`,
      );
    }

    // Check for forbidden secret files / credential patterns
    const basename = path.basename(resolvedPath);
    for (const pattern of WorkspaceSandbox.FORBIDDEN_PATTERNS) {
      if (pattern.test(basename)) {
        throw new WorkspaceSecurityException(
          `Access to sensitive file pattern '${basename}' is strictly blocked for AI runtime security.`,
        );
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
    const forbiddenCommands = [
      /rm\s+-rf\s+\/|rmdir\s+\/s\s+\/q\s+[c-z]:\\/i,
      /format\s+[c-z]:/i,
      /shutdown/i,
      /mkfs/i,
      /dd\s+if=/i,
      /curl.*\|\s*(bash|sh|pwsh)/i,
    ];

    for (const pattern of forbiddenCommands) {
      if (pattern.test(commandLine)) {
        throw new WorkspaceSecurityException(
          `Command contains potentially destructive shell instruction matching security blacklist.`,
        );
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
        env: {
          ...process.env,
          ...options?.env,
          NODE_ENV: 'test',
          CI: 'true',
        },
        windowsVerbatimArguments: true,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL');
        }, 1000);
      }, timeoutMs);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > 500000) {
          stdout = stdout.slice(-500000); // Truncate extreme output
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
