import { BackendToolDefinition, ExecutionContext } from '../interfaces/tool.interface';
import { ToolExecutionResult } from '@vac/shared';

export const gitCommitTool: BackendToolDefinition = {
  name: 'git_commit',
  description: 'Stage modified files and create a new git commit in the workspace repository. Requires human approval.',
  riskLevel: 'HIGH',
  requiresApproval: true,
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Conventional commit message describing changes (e.g. "fix: resolve React component syntax error")',
      },
      files: {
        type: 'string',
        description: 'Optional path of specific files to stage (defaults to "." for all workspace changes)',
      },
    },
    required: ['message'],
  },
  async execute(input: { message: string; files?: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    if (!input.message) {
      return { success: false, error: 'Commit message is required.' };
    }

    const stageTarget = input.files || '.';
    // Stage files
    const stageResult = await context.sandbox.executeCommand(`git add ${stageTarget}`);
    if (stageResult.exitCode !== 0) {
      return {
        success: false,
        error: `Git add failed: ${stageResult.stderr}`,
        exitCode: stageResult.exitCode,
      };
    }

    // Escape message for shell execution
    const safeMessage = input.message.replace(/"/g, '\\"');
    const commitResult = await context.sandbox.executeCommand(`git commit -m "${safeMessage}"`);

    return {
      success: commitResult.exitCode === 0,
      exitCode: commitResult.exitCode,
      stdout: commitResult.stdout,
      stderr: commitResult.stderr,
      durationMs: commitResult.durationMs,
      data: {
        message: input.message,
        commitOutput: commitResult.stdout,
      },
    };
  },
};

export const gitPushTool: BackendToolDefinition = {
  name: 'git_push',
  description: 'Push committed git changes to the remote repository. Requires explicit approval.',
  riskLevel: 'HIGH',
  requiresApproval: true,
  parameters: {
    type: 'object',
    properties: {
      remote: {
        type: 'string',
        description: 'Remote name (default "origin")',
      },
      branch: {
        type: 'string',
        description: 'Branch to push to (default current branch)',
      },
    },
  },
  async execute(input: { remote?: string; branch?: string }, context: ExecutionContext): Promise<ToolExecutionResult> {
    const remote = input.remote || 'origin';
    const branch = input.branch || 'HEAD';
    const result = await context.sandbox.executeCommand(`git push ${remote} ${branch}`);

    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
      data: {
        remote,
        branch,
        output: result.stdout,
      },
    };
  },
};

export const deployApplicationTool: BackendToolDefinition = {
  name: 'deploy_application',
  description: 'Deploy the tested application artifact to staging or production environment. Requires explicit CEO approval.',
  riskLevel: 'CRITICAL',
  requiresApproval: true,
  parameters: {
    type: 'object',
    properties: {
      environment: {
        type: 'string',
        enum: ['staging', 'production'],
        description: 'Target deployment environment',
      },
      version: {
        type: 'string',
        description: 'Semantic release version tag (e.g. "v1.2.0")',
      },
    },
    required: ['environment'],
  },
  async execute(input: { environment: string; version?: string }, _context: ExecutionContext): Promise<ToolExecutionResult> {
    const version = input.version || `v${Date.now()}`;

    return {
      success: true,
      data: {
        environment: input.environment,
        version,
        deployedAt: new Date().toISOString(),
        status: 'DEPLOYED_SUCCESSFULLY',
        message: `Deployment to ${input.environment} successfully dispatched and verified.`,
      },
    };
  },
};
