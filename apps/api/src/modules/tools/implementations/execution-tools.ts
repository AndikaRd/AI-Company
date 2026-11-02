import { BackendToolDefinition, ExecutionContext } from '../interfaces/tool.interface';
import { ToolExecutionResult } from '@vac/shared';
import * as path from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';

export const runBuildTool: BackendToolDefinition = {
  name: 'run_build',
  description: 'Execute the project build process in the workspace sandbox and capture compile errors, stdout, and exit code.',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Optional custom build command. Defaults to auto-detecting build script from package.json (e.g. "npm run build").',
      },
    },
  },
  async execute(input: { command?: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    let cmd = input.command?.trim();

    if (!cmd) {
      // Auto-detect package.json build script
      const pkgPath = path.join(context.sandbox.getWorkspaceRoot(), 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkgJson = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
          if (pkgJson.scripts?.build) {
            cmd = 'npm run build';
          }
        } catch {
          // ignore
        }
      }
      if (!cmd) {
        cmd = 'npm run build';
      }
    }

    const result = await context.sandbox.executeCommand(cmd, {
      timeoutMs: 60000, // 60s
    });

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      data: {
        command: cmd,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? 'BUILD_SUCCESS' : 'BUILD_FAILED',
      },
    };
  },
};

export const runTestsTool: BackendToolDefinition = {
  name: 'run_tests',
  description: 'Execute test suites in the workspace sandbox and capture test assertions, stdout, and exit code.',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Optional custom test command. Defaults to auto-detecting test script from package.json (e.g. "npm test").',
      },
    },
  },
  async execute(input: { command?: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    let cmd = input.command?.trim();

    if (!cmd) {
      const pkgPath = path.join(context.sandbox.getWorkspaceRoot(), 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkgJson = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
          if (pkgJson.scripts?.test) {
            cmd = 'npm test';
          }
        } catch {
          // ignore
        }
      }
      if (!cmd) {
        cmd = 'npm test';
      }
    }

    const result = await context.sandbox.executeCommand(cmd, {
      timeoutMs: 60000,
    });

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      data: {
        command: cmd,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? 'TESTS_PASSED' : 'TESTS_FAILED',
      },
    };
  },
};
