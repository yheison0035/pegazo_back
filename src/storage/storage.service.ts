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

  // Calcula el cobro del guardado según el tiempo transcurrido, la tarifa y la
  // CANTIDAD de cascos. Devuelve el valor por casco y el total.
  private computeCharge(settings: any, ticket: any, at: Date) {
    const helmets = Math.max(1, ticket.helmetCount || 1);
    const mode = ticket.billingMode || settings.defaultMode || 'HORA';
    const ms = at.getTime() - new Date(ticket.checkInAt).getTime();
    if (mode === 'MENSUALIDAD') {
      return {
        mode,
        minutes: 0,
        units: 0,
        unit: 'mes',
        rate: 0,
        helmets,
        perHelmet: 0,
        storageCharge: 0,
        elapsedLabel: this.elapsedLabel(ms),
      };
    }
    const rawMin = Math.max(0, Math.floor(ms / 60000));
    const billable = Math.max(0, rawMin - (settings.graceMinutes || 0));
    let units = 0;
    let rate = 0;
    let unit = 'hora';
    if (mode === 'DIA') {
      rate = settings.dayRate || 0;
      unit = 'día';
      units = billable <= 0 ? 0 : Math.max(1, Math.ceil(billable / 1440));
    } else {
      rate = settings.hourRate || 0;
      unit = 'hora';
      units = billable <= 0 ? 0 : Math.max(1, Math.ceil(billable / 60));
    }
    const perHelmet = Math.round(units * rate);
    return {
      mode,
      minutes: rawMin,
      units,
      unit,
      rate,
      helmets,
      perHelmet,
      storageCharge: perHelmet * helmets,
      elapsedLabel: this.elapsedLabel(ms),
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

  async listActive(user: any) {
    const settings = (await this.getSettings(user)).data;
    const tickets = await this.prisma.storageTicket.findMany({
      where: { companyId: user.companyId, status: 'EN_CUSTODIA' },
      orderBy: { checkInAt: 'asc' },
    });
    const now = new Date();
    const data = tickets.map((t) => ({
      ...t,
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
    return { success: true, data: tickets };
  }

  async checkIn(user: any, dto: CheckInDto) {
    if (!dto.customerName?.trim())
      throw new BadRequestException('El nombre del cliente es obligatorio.');
    if (!dto.customerPhone?.trim() && !dto.customerEmail?.trim())
      throw new BadRequestException('Indica celular o correo del cliente.');

    const settings = (await this.getSettings(user)).data;
    const localId = await this.localId(user.companyId);

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
        userId: user.id,
      },
    });
    return { success: true, data: t };
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
        userId: user.id,
        customerId: t.customerId ?? undefined,
        cashReceived: dto.cashReceived,
        notes:
          `Guarda cascos · ${t.customerName}` +
          (dto.notes ? ` · ${dto.notes}` : ''),
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
