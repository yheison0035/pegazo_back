import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PushService } from '@/push/push.service';

const OWNER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private push: PushService,
  ) {}

  // ---------- Lado NEGOCIO (cliente) ----------

  // Hilo del negocio; al abrirlo, marca como leídas las respuestas de soporte.
  async clientThread(user: any) {
    if (!user.companyId) return { success: true, data: [] };
    await this.prisma.supportMessage.updateMany({
      where: {
        companyId: user.companyId,
        fromPlatform: true,
        readByClient: false,
      },
      data: { readByClient: true },
    });
    const data = await this.prisma.supportMessage.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return { success: true, data };
  }

  async clientSend(user: any, body: string, imageUrl?: string) {
    const text = (body || '').trim();
    const img = (imageUrl || '').trim() || null;
    if (!text && !img)
      throw new BadRequestException('El mensaje está vacío.');
    if (!user.companyId)
      throw new BadRequestException('Usuario sin empresa.');
    const msg = await this.prisma.supportMessage.create({
      data: {
        companyId: user.companyId,
        fromPlatform: false,
        senderUserId: user.id,
        senderName: user.name || 'Cliente',
        body: text.slice(0, 4000),
        imageUrl: img,
        readByPlatform: false,
        readByClient: true,
      },
    });
    return { success: true, data: msg };
  }

  // No leídas por el cliente (respuestas de soporte sin ver).
  async clientUnread(user: any) {
    if (!user.companyId) return { success: true, data: { count: 0 } };
    const count = await this.prisma.supportMessage.count({
      where: {
        companyId: user.companyId,
        fromPlatform: true,
        readByClient: false,
      },
    });
    return { success: true, data: { count } };
  }

  // ---------- Lado PLATAFORMA (soporte) ----------

  // Lista de hilos (empresas) con su último mensaje y no leídos por soporte.
  async threads() {
    const companies = await this.prisma.company.findMany({
      where: { supportMessages: { some: {} } },
      select: { id: true, name: true, logo: true, type: true },
    });
    const out: any[] = [];
    for (const c of companies) {
      const last = await this.prisma.supportMessage.findFirst({
        where: { companyId: c.id },
        orderBy: { createdAt: 'desc' },
      });
      const unread = await this.prisma.supportMessage.count({
        where: { companyId: c.id, fromPlatform: false, readByPlatform: false },
      });
      out.push({
        companyId: c.id,
        companyName: c.name,
        logo: c.logo,
        type: c.type,
        lastMessage: last?.body || (last?.imageUrl ? '📷 Imagen' : ''),
        lastAt: last?.createdAt || null,
        lastFromPlatform: last?.fromPlatform || false,
        unread,
      });
    }
    out.sort(
      (a, b) =>
        new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime(),
    );
    return { success: true, data: out };
  }

  // Mensajes de una empresa; al abrir, marca como leídos los del cliente.
  async platformThread(companyId: number) {
    await this.prisma.supportMessage.updateMany({
      where: { companyId, fromPlatform: false, readByPlatform: false },
      data: { readByPlatform: true },
    });
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, logo: true, type: true },
    });
    const data = await this.prisma.supportMessage.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    return { success: true, data: { company, messages: data } };
  }

  async platformSend(
    user: any,
    companyId: number,
    body: string,
    imageUrl?: string,
  ) {
    const text = (body || '').trim();
    const img = (imageUrl || '').trim() || null;
    if (!text && !img)
      throw new BadRequestException('El mensaje está vacío.');
    const msg = await this.prisma.supportMessage.create({
      data: {
        companyId,
        fromPlatform: true,
        senderUserId: user.id,
        senderName: 'Soporte Pegazo',
        body: text.slice(0, 4000),
        imageUrl: img,
        readByPlatform: true,
        readByClient: false,
      },
    });
    const preview = text.slice(0, 140) || '📷 Imagen';
    // Avisar al negocio (campana + push) que soporte respondió.
    await this.notifications.createForRoles(companyId, OWNER_ROLES, {
      type: 'SUPPORT_REPLY',
      title: 'Soporte te respondió',
      body: preview,
      url: '/dashboard',
      data: { support: true },
    });
    void this.push
      .sendToCompanyRoles(companyId, OWNER_ROLES, {
        title: '💬 Soporte Pegazo',
        body: preview,
        url: '/dashboard',
        tag: `support-${companyId}`,
      })
      .catch(() => null);
    return { success: true, data: msg };
  }

  // Total de mensajes de clientes sin leer por soporte (badge de la plataforma).
  async platformUnread() {
    const count = await this.prisma.supportMessage.count({
      where: { fromPlatform: false, readByPlatform: false },
    });
    return { success: true, data: { count } };
  }
}
