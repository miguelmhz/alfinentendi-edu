import { UserRole, UserStatus } from "../lib/generated/prisma";
import { prisma } from "../lib/prisma";

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuario admin
  const admin = await prisma.user.upsert({
    where: { email: 'miguelmhz1905@gmail.com' },
    update: {},
    create: {
      email: 'miguelmhz1905@gmail.com',
      name: 'Miguel',
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Admin creado:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    roles: admin.roles,
  });

  

  
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });