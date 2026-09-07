import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SalesService } from '@/sales/sales.service';
import { CheckInDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { StorageSettingsDto } from './dto/settings.dto';

const GUARDADO_SERVICE = 'Guardado de casco';
const LAVADO_SERVICE = 'Lavado de casco';

// GUARDA CASCOS — custodia de cascos con cobro dinámico por tiempo (hora/día) o
// mensualidad, más lavado y productos. Aislado: solo lo usa este tipo de negocio.
@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sales: SalesService,
  ) {}

  private async localId(companyId: number) {
    const l = await this.prisma.local.findFirst({
      where: { companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!l) throw new BadRequestException('La empresa no tiene un local.');
    return l.id;
  }

  async getSettings(user: any) {
    let s = await this.prisma.storageSettings.findUnique({
      where: { companyId: user.companyId },
    });
    if (!s) {
      s = await this.prisma.storageSettings.create({
        data: { companyId: user.companyId },
      });
    }
    return { success: true, data: s };
  }

  async updateSettings(user: any, dto: StorageSettingsDto) {
    const data: any = {};
    if (dto.hourRate !== undefined) data.hourRate = Number(dto.hourRate);
    if (dto.dayRate !== undefined) data.dayRate = Number(dto.dayRate);
    if (dto.washPrice !== undefined) data.washPrice = Number(dto.washPrice);
    if (dto.graceMinutes !== undefined)
      data.graceMinutes = Number(dto.graceMinutes);
    if (dto.defaultMode !== undefined) data.defaultMode = dto.defaultMode;

    const s = await this.prisma.storageSettings.upsert({
      where: { companyId: user.companyId },
      update: data,
      create: { companyId: user.companyId, ...data },
    });
    return { success: true, data: s };
  }

  // Cobro del guardado por TIEMPO REAL y por cantidad de cascos:
  //  - Antes de completar la primera unidad (hora/día) → se cobra la unidad
  //    completa (mínimo).
  //  - Después → se cobra por FRACCIÓN, proporcional a los minutos reales
  //    (ej. 1h30 = 1.5 horas, 2h20 = 2.33 horas).
  private computeCharge(settings: any, ticket: any, at: Date) {
    const helmets = Math.max(1, ticket.helmetCount || 1);
    const mode = ticket.billingMode || settings.defaultMode || 'HORA';
    const ms = at.getTime() - new Date(ticket.checkInAt).getTime();
    const rawMin = Math.max(0, Math.floor(ms / 60000));
    const label = this.elapsedLabel(ms);
    if (mode === 'MENSUALIDAD') {
      return {
        mode,
        minutes: rawMin,
        billableMinutes: 0,
        rate: 0,
        unitMin: 0,
        helmets,
        perHelmet: 0,
        storageCharge: 0,
        elapsedLabel: label,
      };
    }
    const grace = settings.graceMinutes || 0;
    const rate = mode === 'DIA' ? settings.dayRate || 0 : settings.hourRate || 0;
    const unitMin = mode === 'DIA' ? 1440 : 60;
    let perHelmet = 0;
    let billable = 0;
    // Dentro del periodo de gracia que configure el dueño no se cobra. Superado
    // ese punto, desde el minuto 1 se cobra la primera unidad completa (primera
    // hora / primer día); al pasar la unidad, el cobro es proporcional.
    if (rawMin >= grace) {
      billable = Math.max(1, rawMin - grace);
      perHelmet =
        billable <= unitMin
          ? Math.round(rate) // 1 unidad completa (mínimo, desde el minuto 1)
          : Math.round((rate * billable) / unitMin); // proporcional (fracción)
    }
    return {
      mode,
      minutes: rawMin,
      billableMinutes: billable,
      rate,
      unitMin,
      helmets,
      perHelmet,
      storageCharge: perHelmet * helmets,
      elapsedLabel: label,
    };
  }

  private elapsedLabel(ms: number) {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }

  // Servicio interno reutilizable (Guardado/Lavado) — se crea una vez por empresa.
  private async ensureService(companyId: number, name: string) {
    let s = await this.prisma.service.findFirst({
      where: { companyId, name },
      select: { id: true },
    });
    if (!s) {
      s = await this.prisma.service.create({
        data: { companyId, name, duration: 0 },
        select: { id: true },
      });
    }
    return s.id;
  }

  // Mapa id->nombre de los usuarios que recibieron (para mostrar quién quedó a
  // cargo).
  private async namesByUser(userIds: (number | null | undefined)[]) {
    const ids = [...new Set(userIds.filter((x): x is number => x != null))];
    if (!ids.length) return {};
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map: Record<number, string> = {};
    for (const u of users) map[u.id] = u.name;
    return map;
  }

  async listActive(user: any) {
    const settings = (await this.getSettings(user)).data;
    const tickets = await this.prisma.storageTicket.findMany({
      where: { companyId: user.companyId, status: 'EN_CUSTODIA' },
      // Los recién recibidos aparecen de primero.
      orderBy: { checkInAt: 'desc' },
    });
    const now = new Date();
    const names = await this.namesByUser(tickets.map((t) => t.userId));
    const data = tickets.map((t) => ({
      ...t,
      receivedByName: t.userId ? names[t.userId] || null : null,
      quote: this.computeCharge(settings, t, now),
    }));
    const summary = {
      active: data.length,
      washPending: data.filter((t) => t.washRequested && !t.washDone).length,
    };
    return { success: true, data, settings, summary };
  }

  async history(user: any, limit = 30) {
    const tickets = await this.prisma.storageTicket.findMany({
      where: { companyId: user.companyId, status: { in: ['ENTREGADO'] } },
      orderBy: { checkOutAt: 'desc' },
      take: Number(limit) || 30,
    });
    const names = await this.namesByUser(tickets.map((t) => t.userId));
    // Ventas vinculadas (para reimprimir la factura con el mismo formato).
    const saleIds = tickets.map((t) => t.saleId).filter((x) => x != null);
    const sales = saleIds.length
      ? await this.prisma.sale.findMany({
          where: { id: { in: saleIds as number[] } },
          include: {
            items: {
              include: {
                variant: { include: { inventory: true } },
                service: true,
              },
            },
            customer: true,
            user: true,
            local: true,
          },
        })
      : [];
    const saleById: Record<number, any> = {};
    for (const s of sales) saleById[s.id] = s;
    const data = tickets.map((t) => ({
      ...t,
      receivedByName: t.userId ? names[t.userId] || null : null,
      sale: t.saleId ? saleById[t.saleId] || null : null,
    }));
    return { success: true, data };
  }

  async checkIn(user: any, dto: CheckInDto) {
    if (!dto.customerName?.trim())
      throw new BadRequestException('El nombre del cliente es obligatorio.');
    if (!dto.customerPhone?.trim() && !dto.customerEmail?.trim())
      throw new BadRequestException('Indica celular o correo del cliente.');

    const settings = (await this.getSettings(user)).data;
    const localId = await this.localId(user.companyId);

    // Quién recibe (asesor a cargo): el elegido si pertenece a la empresa, o el
    // que registra.
    let receivedById = user.id;
    if (dto.receivedById) {
      const u = await this.prisma.user.findFirst({
        where: { id: Number(dto.receivedById), companyId: user.companyId },
        select: { id: true },
      });
      if (u) receivedById = u.id;
    }

    const helmetCount = Math.max(1, Number(dto.helmetCount) || 1);
    // Cuántos lavar: lo que venga; si pidió lavado sin número, se lavan todos.
    let washCount = Number(dto.washCount) || 0;
    if (dto.washRequested && washCount <= 0) washCount = helmetCount;
    washCount = Math.min(washCount, helmetCount);

    const t = await this.prisma.storageTicket.create({
      data: {
        companyId: user.companyId,
        localId,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone?.trim() || null,
        customerEmail: dto.customerEmail?.trim() || null,
        customerId: dto.customerId ?? null,
        checkInAt: dto.checkInAt ? new Date(dto.checkInAt) : new Date(),
        billingMode: dto.billingMode || settings.defaultMode || 'HORA',
        helmetCount,
        washCount,
        washRequested: washCount > 0,
        notes: dto.notes?.trim() || null,
        userId: receivedById,
      },
    });
    const names = await this.namesByUser([receivedById]);
    return {
      success: true,
      data: { ...t, receivedByName: names[receivedById] || null },
    };
  }

  async toggleWash(user: any, id: number, done: boolean) {
    const t = await this.prisma.storageTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    const updated = await this.prisma.storageTicket.update({
      where: { id: t.id },
      data: { washDone: !!done, washRequested: done ? true : t.washRequested },
    });
    return { success: true, data: updated };
  }

  async quote(user: any, id: number) {
    const t = await this.prisma.storageTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    const settings = (await this.getSettings(user)).data;
    return {
      success: true,
      data: { ticket: t, quote: this.computeCharge(settings, t, new Date()) },
    };
  }

  async cancel(user: any, id: number) {
    const t = await this.prisma.storageTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    if (t.status !== 'EN_CUSTODIA')
      throw new BadRequestException('El ticket ya no está en custodia.');
    await this.prisma.storageTicket.update({
      where: { id: t.id },
      data: { status: 'ANULADO', checkOutAt: new Date() },
    });
    return { success: true };
  }

  // Cobra y entrega: calcula el guardado por tiempo, arma la factura dinámica
  // (guardado + lavado + productos) y genera la venta reutilizando el POS.
  async checkout(user: any, id: number, dto: CheckoutDto) {
    const t = await this.prisma.storageTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    if (t.status !== 'EN_CUSTODIA')
      throw new BadRequestException('El ticket ya fue entregado o anulado.');

    const settings = (await this.getSettings(user)).data;
    const at = new Date();
    const charge = this.computeCharge(settings, t, at);
    const includeWash =
      dto.includeWash != null ? dto.includeWash : t.washRequested;
    // Cuántos cascos se lavan: los que pidió (washCount); si no hay número pero
    // marcó lavado, todos.
    const washUnits = includeWash
      ? Math.max(1, t.washCount || t.helmetCount || 1)
      : 0;

    const items: any[] = [];

    // Guardado: valor por casco × cantidad de cascos (cantidad en la factura).
    if (charge.perHelmet > 0 && charge.helmets > 0) {
      const guardadoId = await this.ensureService(
        user.companyId,
        GUARDADO_SERVICE,
      );
      items.push({
        serviceId: guardadoId,
        quantity: charge.helmets,
        priceOverride: charge.perHelmet,
      });
    }

    // Lavado: precio unitario × cascos lavados.
    if (washUnits > 0 && (settings.washPrice || 0) > 0) {
      const lavadoId = await this.ensureService(user.companyId, LAVADO_SERVICE);
      items.push({
        serviceId: lavadoId,
        quantity: washUnits,
        priceOverride: settings.washPrice,
      });
    }

    for (const p of dto.products || []) {
      items.push({
        inventoryVariantId: p.inventoryVariantId,
        quantity: p.quantity,
      });
    }

    let sale: any = null;
    if (items.length > 0) {
      const saleDto: any = {
        paymentMethod: dto.paymentMethod,
        paymentMethodCatalogId: dto.paymentMethodCatalogId,
        paymentStatus: 'PAGADA',
        saleStatus: 'ENTREGADA',
        localId: t.localId,
        // La venta se atribuye a quién recibió el casco (asesor a cargo), para
        // que en Ventas realizadas / reportes quede a su nombre.
        userId: t.userId ?? user.id,
        customerId: t.customerId ?? undefined,
        cashReceived: dto.cashReceived,
        // Observaciones de la factura = la nota que se puso al RECIBIR el casco
        // (+ la del cobro si la hay). Aparece en el recuadro de Observaciones.
        notes:
          [t.notes, dto.notes].filter((x) => x && String(x).trim()).join(' · ') ||
          null,
        items,
      };
      const res = await this.sales.create(saleDto, user);
      sale = (res as any)?.data ?? res;
    }

    const amount = sale?.totalAmount ?? 0;
    const updated = await this.prisma.storageTicket.update({
      where: { id: t.id },
      data: {
        status: 'ENTREGADO',
        checkOutAt: at,
        washDone: includeWash ? true : t.washDone,
        amount,
        saleId: sale?.id ?? null,
      },
    });

    return {
      success: true,
      data: { ticket: updated, sale, charge, includeWash },
    };
  }
}
