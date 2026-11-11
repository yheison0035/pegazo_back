import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '@/prisma.service';
import {
  getAccessibleLocalIds,
  resolveScopedLocalId,
} from '@/common/access-locals.util';

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];
// Descansos: aparece TODO el equipo del local (incluido el administrador) MENOS
// el dueño (SUPER_ADMIN) y el admin de plataforma.
const NON_TEAM_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.SUPER_PLATFORM_ADMIN,
];

@Injectable()
export class RestDaysService {
  constructor(private prisma: PrismaService) {}

  private assertAdmin(user: any) {
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('No tienes permisos');
    }
  }

  private async proOfCompany(userId: number, requester: any) {
    const u = await this.prisma.user.findFirst({
      where: { id: userId, companyId: requester.companyId },
      select: {
        id: true,
        name: true,
        role: true,
        restWeekdays: true,
        localId: true,
      },
    });
    if (!u) throw new NotFoundException('Profesional no encontrado');
    // Aislamiento por local: un administrador solo gestiona descansos de su local.
    const localIds = await getAccessibleLocalIds(this.prisma, requester);
    if (localIds !== null && (u.localId == null || !localIds.includes(u.localId))) {
      throw new ForbiddenException('No tienes acceso a este usuario.');
    }
    return u;
  }

  private dayUtc(dateStr: string) {
    const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
    if (isNaN(d.getTime())) throw new BadRequestException('Fecha inválida');
    return d;
  }

  // Lista de profesionales con agenda (para elegir en la pantalla de descansos).
  async professionals(user: any, localId?: string) {
    this.assertAdmin(user);
    // Aislamiento por local: solo los profesionales de los locales accesibles
    // (un administrador ve los de SU local; el dueño, todos).
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = {
      companyId: user.companyId,
      role: { notIn: NON_TEAM_ROLES },
      status: 'ACTIVO' as any,
    };
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
    }
    // Sede activa del selector global: solo el equipo de esa sede.
    const scoped = resolveScopedLocalId(localIds, localId);
    if (scoped) where.localId = scoped;
    const rows = await this.prisma.user.findMany({
      where,
      select: { id: true, name: true, avatar: true, restWeekdays: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: rows };
  }

  // Los propios descansos del profesional que consulta (rol barbero).
  async mine(user: any) {
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    const [u, timeOff] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { restWeekdays: true, name: true },
      }),
      this.prisma.employeeTimeOff.findMany({
        where: { userId: user.id, date: { gte: today } },
        orderBy: { date: 'asc' },
        select: { id: true, date: true, reason: true },
      }),
    ]);
    return {
      success: true,
      data: {
        userId: user.id,
        name: u?.name,
        restWeekdays: u?.restWeekdays || [],
        timeOff,
      },
    };
  }

  // Resumen de descansos de TODOS los profesionales activos (para el calendario
  // de la agenda). Lectura para dueño/admin/recepción.
  async overview(user: any) {
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    // Aislamiento por local: el equipo mostrado es el de los locales accesibles
    // (un administrador solo ve a los profesionales de SU local; el dueño, todos).
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    const where: any = {
      companyId: user.companyId,
      role: { notIn: NON_TEAM_ROLES },
      status: 'ACTIVO' as any,
    };
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
    }
    const rows = await this.prisma.user.findMany({
      where,
      select: { id: true, name: true, restWeekdays: true },
      orderBy: { name: 'asc' },
    });
    const ids = rows.map((r) => r.id);
    const timeOff = ids.length
      ? await this.prisma.employeeTimeOff.findMany({
          where: { userId: { in: ids }, date: { gte: today } },
          select: { userId: true, date: true, reason: true },
        })
      : [];
    const byUser = new Map<number, { date: Date; reason: string | null }[]>();
    for (const t of timeOff) {
      const arr = byUser.get(t.userId) || [];
      arr.push({ date: t.date, reason: t.reason });
      byUser.set(t.userId, arr);
    }
    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        restWeekdays: r.restWeekdays || [],
        timeOff: byUser.get(r.id) || [],
      })),
    };
  }

  async getForUser(user: any, userId: number) {
    this.assertAdmin(user);
    const u = await this.proOfCompany(userId, user);
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    const timeOff = await this.prisma.employeeTimeOff.findMany({
      where: { userId, date: { gte: today } },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, reason: true },
    });
    return {
      success: true,
      data: { userId, name: u.name, restWeekdays: u.restWeekdays || [], timeOff },
    };
  }

  async setWeekdays(user: any, userId: number, dto: any) {
    this.assertAdmin(user);
    await this.proOfCompany(userId, user);
    const raw = Array.isArray(dto?.restWeekdays) ? dto.restWeekdays : [];
    const nums = raw.map((n: any) => Number(n));
    const days: number[] = [...new Set<number>(nums)].filter(
      (n) => Number.isInteger(n) && n >= 0 && n <= 6,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { restWeekdays: days },
    });
    return { success: true, data: { restWeekdays: days } };
  }

  async addTimeOff(user: any, userId: number, dto: any) {
    this.assertAdmin(user);
    await this.proOfCompany(userId, user);
    if (!dto?.date) throw new BadRequestException('Falta la fecha');
    const date = this.dayUtc(dto.date);
    const reason = dto.reason ? String(dto.reason).trim() : null;
    const row = await this.prisma.employeeTimeOff.upsert({
      where: { userId_date: { userId, date } },
      create: { companyId: user.companyId, userId, date, reason },
      update: { reason },
    });
    return { success: true, data: row };
  }

  async removeTimeOff(user: any, id: number) {
    this.assertAdmin(user);
    const row = await this.prisma.employeeTimeOff.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!row) throw new NotFoundException('Registro no encontrado');
    await this.prisma.employeeTimeOff.delete({ where: { id } });
    return { success: true };
  }
}
