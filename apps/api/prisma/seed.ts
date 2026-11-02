import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_COMPANY = {
  name: 'Nexus AI Dynamics',
  slug: 'nexus-ai-dynamics',
  description: 'Autonomous enterprise operating an intelligence-first synthetic workforce.',
  industry: 'Artificial Intelligence & Autonomous Enterprise',
  website: 'https://nexus.ai.internal',
  status: 'ACTIVE' as const,
};

const INITIAL_DEPARTMENTS = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Core AI models, cloud systems architecture, and platform infrastructure.',
    floorZone: 'ZONE_TECH',
    color: '#3b82f6',
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    description: 'Software development, automated pipelines, testing harnesses, and API services.',
    floorZone: 'ZONE_ENG',
    color: '#10b981',
  },
  {
    name: 'Research',
    slug: 'research',
    description: 'Autonomous research agents, knowledge graph synthesis, and algorithm evaluation.',
    floorZone: 'ZONE_RESEARCH',
    color: '#8b5cf6',
  },
  {
    name: 'Business Analysis',
    slug: 'business-analysis',
    description: 'Market data analysis, competitive intelligence, and workflow metric optimization.',
    floorZone: 'ZONE_BA',
    color: '#f59e0b',
  },
  {
    name: 'Creative',
    slug: 'creative',
    description: 'Generative media, UI/UX conceptual design, asset creation, and content generation.',
    floorZone: 'ZONE_CREATIVE',
    color: '#ec4899',
  },
  {
    name: 'Operations',
    slug: 'operations',
    description: 'Runtime orchestration, token usage monitoring, task queues, and resource allocation.',
    floorZone: 'ZONE_OPS',
    color: '#06b6d4',
  },
  {
    name: 'Quality Assurance',
    slug: 'quality-assurance',
    description: 'Agent behavioral verification, security audits, regression runs, and hallucination checks.',
    floorZone: 'ZONE_QA',
    color: '#ef4444',
  },
  {
    name: 'Administration',
    slug: 'administration',
    description: 'Strategic governance, corporate policy, compliance checks, and organizational oversight.',
    floorZone: 'ZONE_ADMIN',
    color: '#6366f1',
  },
];

async function main() {
  console.log('--- Virtual AI Company Database Seeding Starting ---');

  // Upsert development company
  const company = await prisma.company.upsert({
    where: { slug: SEED_COMPANY.slug },
    update: {
      name: SEED_COMPANY.name,
      description: SEED_COMPANY.description,
      industry: SEED_COMPANY.industry,
      website: SEED_COMPANY.website,
    },
    create: SEED_COMPANY,
  });

  console.log(`[Seed] Company established: ${company.name} (${company.id})`);

  // Seed initial departments
  for (const dept of INITIAL_DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: {
        companyId_slug: {
          companyId: company.id,
          slug: dept.slug,
        },
      },
      update: {
        name: dept.name,
        description: dept.description,
        floorZone: dept.floorZone,
        color: dept.color,
      },
      create: {
        ...dept,
        companyId: company.id,
      },
    });

    console.log(`  -> Department verified: ${department.name} [${department.floorZone}] (${department.id})`);
  }

  // Ensure employee count is verified (zero fake employees seeded as per requirement)
  const employeeCount = await prisma.employee.count({
    where: { department: { companyId: company.id } },
  });

  console.log(`[Seed] Current AI Employees count: ${employeeCount}`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
