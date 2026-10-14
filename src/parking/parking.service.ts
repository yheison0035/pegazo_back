import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SalesService } from '@/sales/sales.service';

const PARKING_SERVICE = 'Parqueadero';

// PARQUEADERO — ingreso/salida de vehículos con cobro por tiempo según la tarifa
// del TIPO de vehículo. Reutiliza el POS para la factura de salida. Aislado.
@Injectable()
export class ParkingService {
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

  // ---- Configuración ----
  async getSettings(user: any) {
    let s = await this.prisma.parkingSettings.findUnique({
      where: { companyId: user.companyId },
    });
    if (!s) {
      s = await this.prisma.parkingSettings.create({
        data: { companyId: user.companyId },
      });
    }
    return { success: true, data: s };
  }

  async updateSettings(user: any, dto: any) {
    const data: any = {};
    if (dto.graceMinutes !== undefined)
      data.graceMinutes = Math.max(0, Number(dto.graceMinutes) || 0);
    if (dto.roundUpToHour !== undefined)
      data.roundUpToHour = !!dto.roundUpToHour;
    const s = await this.prisma.parkingSettings.upsert({
      where: { companyId: user.companyId },
      update: data,
      create: { companyId: user.companyId, ...data },
    });
    return { success: true, data: s };
  }

  // ---- Tipos de vehículo (tarifas) ----
  async listTypes(user: any) {
    const types = await this.prisma.parkingVehicleType.findMany({
      where: { companyId: user.companyId, active: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
    return { success: true, data: types };
  }

  async saveType(user: any, dto: any, id?: number) {
    const name = String(dto.name || '').trim();
    if (!name) throw new BadRequestException('El nombre del tipo es obligatorio.');
    const data = {
      name,
      hourRate: Math.max(0, Number(dto.hourRate) || 0),
      dayMax: Math.max(0, Number(dto.dayMax) || 0),
      monthRate: Math.max(0, Number(dto.monthRate) || 0),
      capacity: Math.max(0, Number(dto.capacity) || 0),
      order: Number(dto.order) || 0,
    };
    if (id) {
      const found = await this.prisma.parkingVehicleType.findFirst({
        where: { id: Number(id), companyId: user.companyId },
        select: { id: true },
      });
      if (!found) throw new NotFoundException('Tipo no encontrado');
      const t = await this.prisma.parkingVehicleType.update({
        where: { id: found.id },
        data,
      });
      return { success: true, data: t };
    }
    const t = await this.prisma.parkingVehicleType.create({
      data: { companyId: user.companyId, ...data },
    });
    return { success: true, data: t };
  }

  async removeType(user: any, id: number) {
    const found = await this.prisma.parkingVehicleType.findFirst({
      where: { id: Number(id), companyId: user.companyId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Tipo no encontrado');
    await this.prisma.parkingVehicleType.update({
      where: { id: found.id },
      data: { active: false },
    });
    return { success: true };
  }

  // ---- Cálculo del cobro ----
  private hourly(min: number, hourRate: number, roundUp: boolean) {
    if (min <= 0 || hourRate <= 0) return 0;
    if (roundUp) return Math.ceil(min / 60) * hourRate;
    if (min <= 60) return hourRate; // primera hora mínima
    return Math.round((hourRate * min) / 60); // proporcional por minuto
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

  private computeCharge(settings: any, type: any, ticket: any, at: Date) {
    const ms = at.getTime() - new Date(ticket.checkInAt).getTime();
    const rawMin = Math.max(0, Math.floor(ms / 60000));
    const label = this.elapsedLabel(ms);
    if (ticket.isMonthly) {
      return {
        minutes: rawMin,
        billableMinutes: 0,
        amount: 0,
        monthly: true,
        elapsedLabel: label,
      };
    }
    const grace = settings?.graceMinutes || 0;
    const roundUp = !!settings?.roundUpToHour;
    const hourRate = Number(type?.hourRate) || 0;
    const dayMax = Number(type?.dayMax) || 0;
    const billable = Math.max(0, rawMin - grace);
    let amount = 0;
    if (billable > 0 && hourRate > 0) {
      const fullDays = Math.floor(billable / 1440);
      const remMin = billable % 1440;
      const dayCharge = dayMax > 0 ? dayMax : this.hourly(1440, hourRate, roundUp);
      let remCharge = this.hourly(remMin, hourRate, roundUp);
      if (dayMax > 0) remCharge = Math.min(remCharge, dayMax);
      amount = Math.round(fullDays * dayCharge + remCharge);
    }
    return {
      minutes: rawMin,
      billableMinutes: billable,
      hourRate,
      dayMax,
      amount,
      monthly: false,
      elapsedLabel: label,
    };
  }

  private genCode() {
    return (
      'P' +
      Date.now().toString(36).slice(-5).toUpperCase() +
      Math.floor(10 + Math.random() * 89)
    );
  }

  private async namesByUser(userIds: (number | null | undefined)[]) {
    const ids = [...new Set(userIds.filter((x): x is number => x != null))];
    if (!ids.length) return {} as Record<number, string>;
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map: Record<number, string> = {};
    for (const u of users) map[u.id] = u.name;
    return map;
  }

  private async typeMap(companyId: number) {
    const types = await this.prisma.parkingVehicleType.findMany({
      where: { companyId },
    });
    const map: Record<number, any> = {};
    for (const t of types) map[t.id] = t;
    return map;
  }

  // ---- Operación ----
  async listActive(user: any) {
    const settings = (await this.getSettings(user)).data;
    const tickets = await this.prisma.parkingTicket.findMany({
      where: { companyId: user.companyId, status: 'DENTRO' },
      orderBy: { checkInAt: 'desc' },
    });
    const now = new Date();
    const types = await this.typeMap(user.companyId);
    const names = await this.namesByUser(tickets.map((t) => t.userId));
    const data = tickets.map((t) => ({
      ...t,
      receivedByName: t.userId ? names[t.userId] || null : null,
      quote: this.computeCharge(
        settings,
        t.vehicleTypeId ? types[t.vehicleTypeId] : null,
        t,
        now,
      ),
    }));
    // Ocupación por tipo (para mostrar cupos).
    const byType: Record<number, number> = {};
    for (const t of tickets)
      if (t.vehicleTypeId)
        byType[t.vehicleTypeId] = (byType[t.vehicleTypeId] || 0) + 1;
    return {
      success: true,
      data,
      settings,
      summary: { inside: data.length, byType },
    };
  }

  async history(user: any, limit = 30) {
    const tickets = await this.prisma.parkingTicket.findMany({
      where: { companyId: user.companyId, status: 'ENTREGADO' },
      orderBy: { checkOutAt: 'desc' },
      take: Number(limit) || 30,
    });
    const names = await this.namesByUser(tickets.map((t) => t.userId));
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

  async checkIn(user: any, dto: any) {
    const plate =
      dto.plate?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
    const hasName = !!dto.customerName?.trim();
    if (!plate && !hasName)
      throw new BadRequestException('Indica la placa o el nombre del cliente.');

    const localId = await this.localId(user.companyId);

    // Tipo de vehículo (snapshot del nombre para histórico).
    let vehicleTypeId: number | null = null;
    let vehicleTypeName: string | null = null;
    if (dto.vehicleTypeId) {
      const vt = await this.prisma.parkingVehicleType.findFirst({
        where: { id: Number(dto.vehicleTypeId), companyId: user.companyId },
      });
      if (vt) {
        vehicleTypeId = vt.id;
        vehicleTypeName = vt.name;
      }
    }

    // Quién registra (operario a cargo).
    let receivedById = user.id;
    if (dto.receivedById) {
      const u = await this.prisma.user.findFirst({
        where: { id: Number(dto.receivedById), companyId: user.companyId },
        select: { id: true },
      });
      if (u) receivedById = u.id;
    }

    // Cliente por placa (para mensualidad / fidelización por placa).
    let customerId = dto.customerId ?? null;
    if (!customerId && plate) {
      const existing = await this.prisma.customer.findFirst({
        where: { companyId: user.companyId, document: plate },
        select: { id: true },
      });
      customerId = existing
        ? existing.id
        : (
            await this.prisma.customer.create({
              data: {
                companyId: user.companyId,
                name: dto.customerName?.trim() || `Placa ${plate}`,
                document: plate,
                phone: dto.customerPhone?.trim() || null,
              },
              select: { id: true },
            })
          ).id;
    }

    const t = await this.prisma.parkingTicket.create({
      data: {
        companyId: user.companyId,
        localId,
        code: this.genCode(),
        plate: plate || null,
        vehicleTypeId,
        vehicleTypeName,
        customerName: dto.customerName?.trim() || null,
        customerPhone: dto.customerPhone?.trim() || null,
        customerId,
        checkInAt: dto.checkInAt ? new Date(dto.checkInAt) : new Date(),
        isMonthly: !!dto.isMonthly,
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

  async quote(user: any, id: number) {
    const t = await this.prisma.parkingTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    const settings = (await this.getSettings(user)).data;
    const type = t.vehicleTypeId
      ? await this.prisma.parkingVehicleType.findUnique({
          where: { id: t.vehicleTypeId },
        })
      : null;
    return {
      success: true,
      data: { ticket: t, quote: this.computeCharge(settings, type, t, new Date()) },
    };
  }

  async cancel(user: any, id: number) {
    const t = await this.prisma.parkingTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    if (t.status !== 'DENTRO')
      throw new BadRequestException('El vehículo ya salió o fue anulado.');
    await this.prisma.parkingTicket.update({
      where: { id: t.id },
      data: { status: 'ANULADO', checkOutAt: new Date() },
    });
    return { success: true };
  }

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

  // Salida: cobra el tiempo según la tarifa del tipo + productos, genera la
  // factura reutilizando el POS y marca el ticket como entregado.
  async checkout(user: any, id: number, dto: any) {
    const t = await this.prisma.parkingTicket.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!t) throw new NotFoundException('Ticket no encontrado');
    if (t.status !== 'DENTRO')
      throw new BadRequestException('El vehículo ya salió o fue anulado.');

    const settings = (await this.getSettings(user)).data;
    const type = t.vehicleTypeId
      ? await this.prisma.parkingVehicleType.findUnique({
          where: { id: t.vehicleTypeId },
        })
      : null;
    const at = new Date();
    const charge = this.computeCharge(settings, type, t, at);

    const items: any[] = [];
    if (charge.amount > 0) {
      const svcId = await this.ensureService(
        user.companyId,
        t.vehicleTypeName
          ? `${PARKING_SERVICE} · ${t.vehicleTypeName}`
          : PARKING_SERVICE,
      );
      items.push({ serviceId: svcId, quantity: 1, priceOverride: charge.amount });
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
        userId: t.userId ?? user.id,
        customerId: t.customerId ?? undefined,
        cashReceived: dto.cashReceived,
        notes:
          [
            `Parqueo ${t.plate || t.code} · ${charge.elapsedLabel}`,
            t.notes,
            dto.notes,
          ]
            .filter((x) => x && String(x).trim())
            .join(' · ') || null,
        items,
      };
      const res = await this.sales.create(saleDto, user);
      sale = (res as any)?.data ?? res;
    }

    const amount = sale?.totalAmount ?? 0;
    const updated = await this.prisma.parkingTicket.update({
      where: { id: t.id },
      data: {
        status: 'ENTREGADO',
        checkOutAt: at,
        amount,
        saleId: sale?.id ?? null,
      },
    });
    return { success: true, data: { ticket: updated, sale, charge } };
  }
}
