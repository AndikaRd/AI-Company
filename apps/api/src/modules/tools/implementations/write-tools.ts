import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { BackendToolDefinition, ExecutionContext } from '../interfaces/tool.interface';
import { ToolExecutionResult } from '@vac/shared';

export const createFileTool: BackendToolDefinition = {
  name: 'create_file',
  description: 'Create a new file in the workspace with initial content. Fails if file already exists unless overwrite=true.',
  riskLevel: 'LOW',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the new file to create',
      },
      content: {
        type: 'string',
        description: 'Text content to write into the file',
      },
      overwrite: {
        type: 'boolean',
        description: 'Allow replacing existing file if true (default false)',
      },
    },
    required: ['path', 'content'],
  },
  async execute(
    input: { path: string; content: string; overwrite?: boolean },
    context: ExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (!input.path) return { success: false, error: 'Path is required.' };
    if (typeof input.content !== 'string') return { success: false, error: 'Content is required.' };

    const safePath = context.sandbox.resolveSafePath(input.path);

    if (existsSync(safePath) && !input.overwrite) {
      return {
        success: false,
        error: `File '${input.path}' already exists. Pass overwrite=true to replace it or use edit_file.`,
      };
    }

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, input.content, 'utf-8');

    return {
      success: true,
      data: {
        path: input.path,
        bytesWritten: Buffer.byteLength(input.content, 'utf-8'),
        created: !existsSync(safePath),
      },
    };
  },
};

export const editFileTool: BackendToolDefinition = {
  name: 'edit_file',
  description: 'Surgically replace an exact target string with a replacement string in an existing workspace file.',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file to modify',
      },
      target: {
        type: 'string',
        description: 'Exact substring in the file to replace (must match exactly including whitespace)',
      },
      replacement: {
        type: 'string',
        description: 'Replacement string to insert in place of target',
      },
    },
    required: ['path', 'target', 'replacement'],
  },
  async execute(
    input: { path: string; target: string; replacement: string },
    context: ExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (!input.path) return { success: false, error: 'File path is required.' };
    if (typeof input.target !== 'string') return { success: false, error: 'Target string is required.' };
    if (typeof input.replacement !== 'string') return { success: false, error: 'Replacement string is required.' };

    const safePath = context.sandbox.resolveSafePath(input.path);

    if (!existsSync(safePath)) {
      return { success: false, error: `File '${input.path}' does not exist.` };
    }

    await context.sandbox.validateFileSize(safePath);
    const existingContent = await fs.readFile(safePath, 'utf-8');

    if (!existingContent.includes(input.target)) {
      return {
        success: false,
        error: `Target string was not found in '${input.path}'. Ensure exact character match including line breaks and indentation.`,
      };
    }

    const occurrences = existingContent.split(input.target).length - 1;
    const newContent = existingContent.replace(input.target, input.replacement);
    await fs.writeFile(safePath, newContent, 'utf-8');

    return {
      success: true,
      data: {
        path: input.path,
        occurrencesReplaced: 1,
        totalOccurrencesFound: occurrences,
        newSize: Buffer.byteLength(newContent, 'utf-8'),
      },
    };
  },
};

export const writeFileTool: BackendToolDefinition = {
  name: 'write_file',
  description: 'Write complete text content to a file in the workspace, creating or overwriting it.',
  riskLevel: 'MEDIUM',
  requiresApproval: false,
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path of the file to write',
      },
      content: {
        type: 'string',
        description: 'Complete new content of the file',
      },
    },
    required: ['path', 'content'],
  },
  async execute(
    input: { path: string; content: string },
    context: ExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (!input.path) return { success: false, error: 'File path is required.' };
    if (typeof input.content !== 'string') return { success: false, error: 'Content is required.' };

    const safePath = context.sandbox.resolveSafePath(input.path);
    await fs.mkdir(path.dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, input.content, 'utf-8');

    return {
      success: true,
      data: {
        path: input.path,
        bytesWritten: Buffer.byteLength(input.content, 'utf-8'),
      },
    };
  },
};
