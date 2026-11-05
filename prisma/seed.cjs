require("dotenv").config();

const {
  PrismaClient,
  OrganizationType,
  OrganizationStatus,
  UserStatus,
  MemberRole,
} = require("@prisma/client");

const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME;
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error("Missing required SEED_ADMIN_* environment variables.");
  }

  if (adminPassword.length < 8) {
    throw new Error("Admin password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.upsert({
      where: { slug: "cj-cebu-adventures" },
      update: {
        status: OrganizationStatus.ACTIVE,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        name: "CJ Cebu Adventures",
        slug: "cj-cebu-adventures",
        type: OrganizationType.TOUR_OPERATOR,
        status: OrganizationStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const existingUser = await tx.user.findUnique({
      where: { email: adminEmail },
    });

    const user = existingUser
      ? existingUser
      : await tx.user.create({
          data: {
            id: randomUUID(),
            name: adminName,
            email: adminEmail,
            passwordHash,
            status: UserStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

    const membership = await tx.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: MemberRole.OWNER,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        userId: user.id,
        organizationId: organization.id,
        role: MemberRole.OWNER,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      organization,
      user,
      membership,
      adminCreated: !existingUser,
    };
  });

  console.log("LaagGo seeding completed successfully.");
  console.log(`Organization: ${result.organization.name}`);
  console.log(`Admin email: ${result.user.email}`);
  console.log(`Membership role: ${result.membership.role}`);
  console.log(`Admin created: ${result.adminCreated}`);
}

main()
  .catch((error) => {
    console.error("LaagGo seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });