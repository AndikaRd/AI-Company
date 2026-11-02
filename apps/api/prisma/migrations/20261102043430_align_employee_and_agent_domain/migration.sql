-- CreateEnum
CREATE TYPE "SeniorityLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OLLAMA', 'OPENAI', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('MANUAL', 'SUPERVISED', 'AUTONOMOUS');

-- AlterTable
ALTER TABLE "agent_configurations" ADD COLUMN     "autonomy_level" "AutonomyLevel" NOT NULL DEFAULT 'SUPERVISED',
ADD COLUMN     "memory_config" JSONB,
ADD COLUMN     "permission_config" JSONB,
ADD COLUMN     "provider" "AiProvider" NOT NULL DEFAULT 'OLLAMA',
ALTER COLUMN "model_name" SET DEFAULT 'qwen3.5:4b';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employee_code" TEXT,
ADD COLUMN     "job_title" TEXT,
ADD COLUMN     "personality" TEXT,
ADD COLUMN     "primary_expertise" TEXT,
ADD COLUMN     "seniority" "SeniorityLevel" NOT NULL DEFAULT 'MID',
ADD COLUMN     "skills" JSONB,
ADD COLUMN     "supervisor_id" TEXT,
ADD COLUMN     "workstation_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_supervisor_id_idx" ON "employees"("supervisor_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

