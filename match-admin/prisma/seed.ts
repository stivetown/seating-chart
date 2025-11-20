import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Freeda tenant
  const freeda = await prisma.tenant.upsert({
    where: { slug: 'freeda' },
    update: {},
    create: {
      name: 'Freeda',
      slug: 'freeda',
      config: {
        primaryColor: '#8B5CF6',
        brandName: 'Freeda',
        features: {
          matching: true,
          groups: true,
          recommendations: true,
        },
      },
    },
  });

  console.log('Created tenant:', freeda.name);

  // Create admin user (password: admin123 - CHANGE IN PRODUCTION!)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@freeda.com' },
    update: {},
    create: {
      email: 'admin@freeda.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      tenantId: freeda.id,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create default matching weights for Freeda
  const defaultWeights = [
    { attributePath: 'age', weight: 0.3, matchType: 'range' },
    { attributePath: 'location', weight: 0.2, matchType: 'similarity' },
    { attributePath: 'interests', weight: 0.4, matchType: 'similarity' },
    { attributePath: 'background', weight: 0.1, matchType: 'diversity' },
  ];

  for (const weight of defaultWeights) {
    await prisma.matchingWeight.upsert({
      where: {
        tenantId_attributePath: {
          tenantId: freeda.id,
          attributePath: weight.attributePath,
        },
      },
      update: {},
      create: {
        tenantId: freeda.id,
        ...weight,
      },
    });
  }

  console.log('Created default matching weights');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

