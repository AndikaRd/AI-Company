import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { BackendToolDefinition, ExecutionContext } from '../interfaces/tool.interface';
import { ToolExecutionResult } from '@vac/shared';

export const listFilesTool: BackendToolDefinition = {
  name: 'list_files',
  description: 'List files and directories in the workspace under the specified relative path.',
  riskLevel: 'READ_ONLY',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative directory path inside the workspace to inspect (default is root ".")',
      },
      recursive: {
        type: 'boolean',
        description: 'Whether to recursively traverse subdirectories (default false)',
      },
    },
  },
  async execute(input: { path?: string; recursive?: boolean }, context: ExecutionContext): Promise<ToolExecutionResult> {
    const targetPath = context.sandbox.resolveSafePath(input.path || '.');
    const isRecursive = Boolean(input.recursive);

    if (!existsSync(targetPath)) {
      return {
        success: false,
        error: `Directory '${input.path || '.'}' does not exist in workspace.`,
      };
    }

    const items: Array<{ name: string; path: string; type: 'file' | 'directory'; size?: number }> = [];

    async function walk(dir: string, depth = 0) {
      if (depth > 4) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip common noisy or internal folders
        if (['.git', 'node_modules', 'dist', '.gemini', '.turbo'].includes(entry.name)) {
          continue;
        }

        const fullItemPath = path.join(dir, entry.name);
        const relativeItemPath = path.relative(context.sandbox.getWorkspaceRoot(), fullItemPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          items.push({ name: entry.name, path: relativeItemPath, type: 'directory' });
          if (isRecursive) {
            await walk(fullItemPath, depth + 1);
          }
        } else {
          try {
            const stat = await fs.stat(fullItemPath);
            items.push({ name: entry.name, path: relativeItemPath, type: 'file', size: stat.size });
          } catch {
            items.push({ name: entry.name, path: relativeItemPath, type: 'file' });
          }
        }
      }
    }

    await walk(targetPath);

    return {
      success: true,
      data: {
        target: input.path || '.',
        count: items.length,
        items,
      },
    };
  },
};

export const readFileTool: BackendToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a text file within the workspace with line numbers and optional line range.',
  riskLevel: 'READ_ONLY',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file to read',
      },
      startLine: {
        type: 'number',
        description: 'Optional 1-based start line index to read from',
      },
      endLine: {
        type: 'number',
        description: 'Optional 1-based end line index to read to (inclusive)',
      },
    },
    required: ['path'],
  },
  async execute(
    input: { path: string; startLine?: number; endLine?: number },
    context: ExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (!input.path) {
      return { success: false, error: 'File path parameter is required.' };
    }

    const safePath = context.sandbox.resolveSafePath(input.path);

    if (!existsSync(safePath)) {
      return { success: false, error: `File '${input.path}' does not exist.` };
    }

    await context.sandbox.validateFileSize(safePath);

    const rawContent = await fs.readFile(safePath, 'utf-8');
    const lines = rawContent.split(/\r?\n/);
    const totalLines = lines.length;

    let start = input.startLine ? Math.max(1, input.startLine) : 1;
    let end = input.endLine ? Math.min(totalLines, input.endLine) : totalLines;

    if (start > end) {
      start = 1;
      end = totalLines;
    }

    const selectedLines = lines.slice(start - 1, end);
    const formattedContent = selectedLines
      .map((line, idx) => `${start + idx}: ${line}`)
      .join('\n');

    return {
      success: true,
      data: {
        path: input.path,
        startLine: start,
        endLine: end,
        totalLines,
        content: formattedContent,
      },
    };
  },
};

export const searchCodeTool: BackendToolDefinition = {
  name: 'search_code',
  description: 'Search for text or regex pattern across code files in the authorized workspace.',
  riskLevel: 'READ_ONLY',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term or regex pattern to look for',
      },
      path: {
        type: 'string',
        description: 'Subdirectory inside workspace to limit search to (default ".")',
      },
    },
    required: ['query'],
  },
  async execute(input: { query: string; path?: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    if (!input.query) {
      return { success: false, error: 'Query parameter is required.' };
    }

    const targetDir = context.sandbox.resolveSafePath(input.path || '.');
    const matches: Array<{ file: string; line: number; preview: string }> = [];
    const queryLower = input.query.toLowerCase();

    async function searchDir(dir: string, depth = 0) {
      if (depth > 5 || matches.length >= 50) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (['.git', 'node_modules', 'dist', '.gemini', '.turbo'].includes(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await searchDir(fullPath, depth + 1);
        } else {
          // Only search text/code files
          const ext = path.extname(entry.name).toLowerCase();
          if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.txt', '.sql'].includes(ext)) {
            continue;
          }

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(queryLower)) {
                matches.push({
                  file: path.relative(context.sandbox.getWorkspaceRoot(), fullPath).replace(/\\/g, '/'),
                  line: i + 1,
                  preview: lines[i].trim().slice(0, 160),
                });
                if (matches.length >= 50) break;
              }
            }
          } catch {
            // Skip unreadable files
          }
        }
      }
    }

    await searchDir(targetDir);

    return {
      success: true,
      data: {
        query: input.query,
        matchCount: matches.length,
        matches,
      },
    };
  },
};

export const getFileInfoTool: BackendToolDefinition = {
  name: 'get_file_info',
  description: 'Retrieve metadata about a file or directory including size, line count, and last modification timestamp.',
  riskLevel: 'READ_ONLY',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file or directory',
      },
    },
    required: ['path'],
  },
  async execute(input: { path: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    if (!input.path) {
      return { success: false, error: 'Path parameter is required.' };
    }

    const safePath = context.sandbox.resolveSafePath(input.path);

    if (!existsSync(safePath)) {
      return { success: false, error: `Path '${input.path}' does not exist.` };
    }

    const stat = await fs.stat(safePath);
    let lineCount: number | undefined;

    if (!stat.isDirectory()) {
      try {
        const content = await fs.readFile(safePath, 'utf-8');
        lineCount = content.split(/\r?\n/).length;
      } catch {
        // Binary or unreadable
      }
    }

    return {
      success: true,
      data: {
        path: input.path,
        isDirectory: stat.isDirectory(),
        sizeBytes: stat.size,
        extension: path.extname(input.path),
        modifiedAt: stat.mtime.toISOString(),
        lineCount,
      },
    };
  },
};

export const gitStatusTool: BackendToolDefinition = {
  name: 'git_status',
  description: 'Inspect the git status of the authorized workspace repository.',
  riskLevel: 'READ_ONLY',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {},
  },
  async execute(_input: any, context: ExecutionContext): Promise<ToolExecutionResult> {
    const result = await context.sandbox.executeCommand('git status --short');
    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      data: {
        clean: result.stdout.length === 0,
        output: result.stdout || 'Working tree clean',
        stderr: result.stderr,
      },
      durationMs: result.durationMs,
    };
  },
};
