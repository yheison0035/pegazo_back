import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  url?: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Crea una notificación para un usuario.
  async create(companyId: number, userId: number, input: NotificationInput) {
    if (!userId || !companyId) return null;
    return this.prisma.notification.create({
      data: {
        companyId,
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        url: input.url ?? null,
        data: input.data ?? undefined,
      },
    });
  }

  // Crea la misma notificación para todos los usuarios ACTIVOS con ciertos roles.
  async createForRoles(
    companyId: number,
    roles: string[],
    input: NotificationInput,
    exceptUserId?: number,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        role: { in: roles as any },
        status: { not: 'ELIMINADO' as any },
        ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
      },
      select: { id: true },
    });
    if (users.length === 0) return { count: 0 };
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        companyId,
        userId: u.id,
        type: input.type,
        title: input.title,
        body: input.body,
        url: input.url ?? null,
        data: input.data ?? undefined,
      })),
    });
    return { count: users.length };
  }

  // Lista reciente del usuario (para la campana).
  async list(user: any, limit = 30) {
    const data = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 30, 100),
    });
    return { success: true, data };
  }

  async unreadCount(user: any) {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return { success: true, data: { count } };
  }

  async markRead(user: any, id: number) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(user: any) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }
}
