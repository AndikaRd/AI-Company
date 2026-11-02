-- CreateEnum
CREATE TYPE "AgentMessageType" AS ENUM ('DIRECT_MESSAGE', 'TASK_DELEGATION', 'TASK_ACCEPTED', 'TASK_REJECTED', 'TASK_UPDATE', 'TASK_COMPLETED', 'QUERY', 'RESPONSE');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "responsibilities" JSONB;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "delegated_by_employee_id" TEXT,
ADD COLUMN     "delegation_depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "depends_on_task_ids" JSONB,
ADD COLUMN     "parent_task_id" TEXT,
ADD COLUMN     "required_skills" JSONB;

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "sender_employee_id" TEXT NOT NULL,
    "recipient_employee_id" TEXT NOT NULL,
    "task_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "message_type" "AgentMessageType" NOT NULL DEFAULT 'DIRECT_MESSAGE',
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_messages_sender_employee_id_idx" ON "agent_messages"("sender_employee_id");

-- CreateIndex
CREATE INDEX "agent_messages_recipient_employee_id_idx" ON "agent_messages"("recipient_employee_id");

-- CreateIndex
CREATE INDEX "agent_messages_task_id_idx" ON "agent_messages"("task_id");

-- CreateIndex
CREATE INDEX "agent_messages_correlation_id_idx" ON "agent_messages"("correlation_id");

-- CreateIndex
CREATE INDEX "tasks_delegated_by_employee_id_idx" ON "tasks"("delegated_by_employee_id");

-- CreateIndex
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks"("parent_task_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_delegated_by_employee_id_fkey" FOREIGN KEY ("delegated_by_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_sender_employee_id_fkey" FOREIGN KEY ("sender_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_recipient_employee_id_fkey" FOREIGN KEY ("recipient_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
