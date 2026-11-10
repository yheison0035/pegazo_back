// src/common/access-locals.util.ts
import { ForbiddenException } from '@nestjs/common';
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

// Verifica que el usuario pueda ACCEDER a un local concreto (para leer o mutar
// un registro de ese local). Lanza 403 si no. Para los roles que ven todos los
// locales (dueño/roles globales) solo exige que el local sea de SU empresa (evita
// fugas entre empresas); para los demás, que esté entre sus locales accesibles.
// Es la contraparte "de un registro" de applyLocalFilter (que es para listados).
export async function assertLocalAccess(
  prisma: PrismaService,
  user: any,
  localId: number | null | undefined,
): Promise<void> {
  if (!localId) {
    throw new ForbiddenException('No tienes acceso a este local');
  }
  const ids = await getAccessibleLocalIds(prisma, user);

  // Roles globales (null): el local debe pertenecer a su empresa.
  if (ids === null) {
    if (user.role === 'SUPER_PLATFORM_ADMIN') return;
    const own = await prisma.local.findFirst({
      where: { id: Number(localId), companyId: user.companyId },
      select: { id: true },
    });
    if (!own) throw new ForbiddenException('No tienes acceso a este local');
    return;
  }

  if (!ids.includes(Number(localId))) {
    throw new ForbiddenException('No tienes acceso a este local');
  }
}

/**
 * Sede activa del selector global: devuelve el id SOLO si fue pedido y es
 * accesible (accessible === null = dueño/roles globales que ven todo). Si no se
 * pidió o no es accesible, devuelve null (= sin acotar a una sola sede).
 */
export function resolveScopedLocalId(
  accessible: number[] | null,
  localIdRaw: any,
): number | null {
  const req =
    localIdRaw && /^\d+$/.test(String(localIdRaw)) ? Number(localIdRaw) : null;
  if (req && (accessible === null || accessible.includes(req))) return req;
  return null;
}
