// src/common/access-locals.util.ts
import { PrismaService } from '@/prisma.service';
import { Role } from '@prisma/client';

export async function getAccessibleLocalIds(
  prisma: PrismaService,
  user: any,
): Promise<number[] | null> {
  // SUPER_PLATFORM_ADMIN ve TODO (todas las empresas)
  if (user.role === 'SUPER_PLATFORM_ADMIN') {
    return null;
  }

  // Roles con acceso total dentro de SU empresa
  if ([Role.SUPER_ADMIN, Role.COORDINADOR, Role.AUXILIAR].includes(user.role)) {
    return null; // null = sin filtro PERO luego se filtra por companyId
  }

  // ADMIN = administrador de UN local: ve SOLO lo relacionado con el local que
  // tiene ASIGNADO (user.localId). El dueño (SUPER_ADMIN) es el ÚNICO que ve
  // todos los locales de la empresa; un administrador nunca ve otro local, ni
  // aunque figure como manager de otras sedes.
  if (user.role === Role.ADMIN) {
    // Con local asignado: EXCLUSIVAMENTE ese local.
    if (user.localId) {
      const own = await prisma.local.findFirst({
        where: { id: user.localId, companyId: user.companyId },
        select: { id: true },
      });
      return own ? [own.id] : [];
    }

    // Sin local asignado: compatibilidad con setups antiguos donde el acceso del
    // administrador se definía por los locales que administra como manager.
    const managedLocals = await prisma.local.findMany({
      where: {
        managerId: user.id,
        companyId: user.companyId,
      },
      select: { id: true },
    });
    return managedLocals.map((l) => l.id);
  }

  // Usuario con un solo local asignado
  if (user.localId) {
    // Validar que el local pertenece a su empresa
    const local = await prisma.local.findFirst({
      where: {
        id: user.localId,
        companyId: user.companyId,
      },
      select: { id: true },
    });

    if (!local) return [];

    return [local.id];
  }

  // Sin acceso
  return [];
}
