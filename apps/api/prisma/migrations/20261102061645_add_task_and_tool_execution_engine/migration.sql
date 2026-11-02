-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'PLANNING', 'IN_PROGRESS', 'WAITING_APPROVAL', 'REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'WAITING_APPROVAL', 'REVIEW', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ToolCallStatus" AS ENUM ('SUCCESS', 'FAILURE', 'BLOCKED', 'APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_employee_id" TEXT NOT NULL,
    "workspace_path" TEXT,
    "deliverables" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_executions" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PLANNING',
    "summary" TEXT,
    "deliverables" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_execution_logs" (
    "id" TEXT NOT NULL,
    "task_execution_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "exit_code" INTEGER,
    "duration_ms" INTEGER,
    "risk_level" TEXT NOT NULL,
    "status" "ToolCallStatus" NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_execution_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "risk_level" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_assigned_employee_id_idx" ON "tasks"("assigned_employee_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "task_executions_task_id_idx" ON "task_executions"("task_id");

-- CreateIndex
CREATE INDEX "tool_execution_logs_task_execution_id_idx" ON "tool_execution_logs"("task_execution_id");

-- CreateIndex
CREATE INDEX "tool_execution_logs_tool_name_idx" ON "tool_execution_logs"("tool_name");

-- CreateIndex
CREATE INDEX "approval_requests_task_id_idx" ON "approval_requests"("task_id");

-- CreateIndex
CREATE INDEX "approval_requests_task_execution_id_idx" ON "approval_requests"("task_execution_id");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_execution_logs" ADD CONSTRAINT "tool_execution_logs_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "task_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "task_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

