-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('WORKING', 'EPISODIC', 'SEMANTIC');

-- CreateEnum
CREATE TYPE "MemoryScope" AS ENUM ('EMPLOYEE_PRIVATE', 'PROJECT_SHARED', 'COMPANY_SHARED', 'TASK_SCOPED');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "MemorySourceType" AS ENUM ('TASK_EXECUTION', 'AGENT_DECISION', 'AGENT_COMMUNICATION', 'KNOWLEDGE_DOCUMENT', 'EXECUTIVE_DIRECTIVE', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "KnowledgeCategory" AS ENUM ('CODING_STANDARDS', 'ARCHITECTURE_GUIDELINES', 'COMPANY_POLICY', 'PRODUCT_SPECIFICATION', 'SECURITY_PRACTICES', 'QA_VERIFICATION', 'GENERAL');

-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "category" "MemoryCategory" NOT NULL,
    "scope" "MemoryScope" NOT NULL,
    "status" "MemoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "tags" JSONB,
    "owner_employee_id" TEXT,
    "department_id" TEXT,
    "project_id" TEXT,
    "task_id" TEXT,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "embedding" JSONB,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_sources" (
    "id" TEXT NOT NULL,
    "source_type" "MemorySourceType" NOT NULL,
    "source_ref" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "raw_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "KnowledgeCategory" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "author_employee_id" TEXT,
    "department_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_knowledge" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_access_logs" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "accessed_by_employee_id" TEXT NOT NULL,
    "task_id" TEXT,
    "action" TEXT NOT NULL,
    "query_context" TEXT,
    "relevance_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memories_source_id_key" ON "memories"("source_id");

-- CreateIndex
CREATE INDEX "memories_owner_employee_id_idx" ON "memories"("owner_employee_id");

-- CreateIndex
CREATE INDEX "memories_category_idx" ON "memories"("category");

-- CreateIndex
CREATE INDEX "memories_scope_idx" ON "memories"("scope");

-- CreateIndex
CREATE INDEX "memories_status_idx" ON "memories"("status");

-- CreateIndex
CREATE INDEX "memories_task_id_idx" ON "memories"("task_id");

-- CreateIndex
CREATE INDEX "memories_project_id_idx" ON "memories"("project_id");

-- CreateIndex
CREATE INDEX "memories_department_id_idx" ON "memories"("department_id");

-- CreateIndex
CREATE INDEX "memory_sources_source_type_idx" ON "memory_sources"("source_type");

-- CreateIndex
CREATE INDEX "memory_sources_is_verified_idx" ON "memory_sources"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_documents_slug_key" ON "knowledge_documents"("slug");

-- CreateIndex
CREATE INDEX "knowledge_documents_category_idx" ON "knowledge_documents"("category");

-- CreateIndex
CREATE INDEX "knowledge_documents_department_id_idx" ON "knowledge_documents"("department_id");

-- CreateIndex
CREATE INDEX "knowledge_documents_is_approved_idx" ON "knowledge_documents"("is_approved");

-- CreateIndex
CREATE INDEX "project_knowledge_project_id_idx" ON "project_knowledge"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_knowledge_project_id_key_key" ON "project_knowledge"("project_id", "key");

-- CreateIndex
CREATE INDEX "memory_access_logs_memory_id_idx" ON "memory_access_logs"("memory_id");

-- CreateIndex
CREATE INDEX "memory_access_logs_accessed_by_employee_id_idx" ON "memory_access_logs"("accessed_by_employee_id");

-- CreateIndex
CREATE INDEX "memory_access_logs_task_id_idx" ON "memory_access_logs"("task_id");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_owner_employee_id_fkey" FOREIGN KEY ("owner_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "memory_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_author_employee_id_fkey" FOREIGN KEY ("author_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_access_logs" ADD CONSTRAINT "memory_access_logs_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_access_logs" ADD CONSTRAINT "memory_access_logs_accessed_by_employee_id_fkey" FOREIGN KEY ("accessed_by_employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
