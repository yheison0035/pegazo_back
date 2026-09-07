import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { Status } from '@prisma/client';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PayMembershipDto } from './dto/pay-membership.dto';

// Membresías / mensualidades recurrentes por cliente (guarda cascos, canchas,
// gym, parqueadero…). Se define una vez y cada mes se cobra; el estado del mes
// (al día / vencido) se deriva de los cobros. Ingreso recurrente.
@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  // Ventana del MES calendario actual (hora Colombia, UTC-5).
  private currentMonth() {
    const now = new Date();
    const co = new Date(now.getTime() - 5 * 3600 * 1000);
    const y = co.getUTCFullYear();
    const m = co.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    const MES = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return { start, end, label: `${MES[m]} ${y}` };
  }

  private async resolveLocalId(companyId: number, localId?: number) {
    if (localId) {
      const l = await this.prisma.local.findFirst({
        where: { id: Number(localId), companyId },
        select: { id: true },
      });
      if (l) return l.id;
    }
    const first = await this.prisma.local.findFirst({
      where: { companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!first)
      throw new BadRequestException('La empresa no tiene un local configurado.');
    return first.id;
  }

  private async assertCustomer(companyId: number, customerId?: number) {
    if (!customerId) return null;
    const c = await this.prisma.customer.findFirst({
      where: { id: Number(customerId), companyId },
      select: { id: true },
    });
    if (!c) throw new BadRequestException('Cliente no encontrado.');
    return c.id;
  }

  async list(user: any) {
    const items = await this.prisma.membership.findMany({
      where: { companyId: user.companyId, status: { not: Status.ELIMINADO } },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        local: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
    });

    const ids = items.map((i) => i.id);
    const { start, end, label } = this.currentMonth();

    const payments = ids.length
      ? await this.prisma.membershipPayment.findMany({
          where: {
            membershipId: { in: ids },
            status: Status.ACTIVO,
            paidDate: { gte: start, lt: end },
          },
          orderBy: { paidDate: 'desc' },
          select: {
            id: true,
            membershipId: true,
            amount: true,
            paidDate: true,
            notes: true,
            paymentMethod: true,
          },
        })
      : [];

    const payByMembership: Record<number, any> = {};
    for (const p of payments) {
      if (!payByMembership[p.membershipId]) payByMembership[p.membershipId] = p;
    }

    const data = items.map((m) => {
      const lastPayment = payByMembership[m.id] || null;
      return { ...m, paidThisMonth: !!lastPayment, lastPayment };
    });

    const paid = data.filter((d) => d.paidThisMonth);
    const pending = data.filter((d) => !d.paidThisMonth);
    const summary = {
      period: label,
      count: items.length,
      totalMonthly: items.reduce((s, m) => s + m.amount, 0),
      collected: paid.reduce((s, d) => s + (d.lastPayment?.amount ?? d.amount), 0),
      upToDate: paid.length,
      overdueCount: pending.length,
      overdueAmount: pending.reduce((s, d) => s + d.amount, 0),
    };

    return { success: true, data, summary };
  }

  async create(user: any, dto: CreateMembershipDto) {
    if (!dto.name?.trim())
      throw new BadRequestException('El nombre del plan es obligatorio.');
    if (!(Number(dto.amount) > 0))
      throw new BadRequestException('El monto debe ser mayor a 0.');

    const localId = await this.resolveLocalId(user.companyId, dto.localId);
    const customerId = await this.assertCustomer(user.companyId, dto.customerId);

    const created = await this.prisma.membership.create({
      data: {
        companyId: user.companyId,
        customerId,
        name: dto.name.trim(),
        amount: Number(dto.amount),
        dueDay: dto.dueDay ?? null,
        localId,
        notes: dto.notes?.trim() || null,
      },
    });
    return { success: true, data: created };
  }

  async update(user: any, id: number, dto: UpdateMembershipDto) {
    const m = await this.prisma.membership.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!m) throw new NotFoundException('Membresía no encontrada');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.amount !== undefined) data.amount = Number(dto.amount);
    if (dto.dueDay !== undefined) data.dueDay = dto.dueDay ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.customerId !== undefined) {
      data.customerId = await this.assertCustomer(
        user.companyId,
        dto.customerId,
      );
    }
    if (dto.localId !== undefined) {
      data.localId = await this.resolveLocalId(user.companyId, dto.localId);
    }

    const updated = await this.prisma.membership.update({
      where: { id: m.id },
      data,
    });
    return { success: true, data: updated };
  }

  async remove(user: any, id: number) {
    const m = await this.prisma.membership.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.prisma.membership.update({
      where: { id: m.id },
      data: { status: Status.ELIMINADO },
    });
    return { success: true };
  }

  // Cobra la membresía del mes: registra un MembershipPayment con fecha y
  // observación. Bloquea el doble cobro del mismo mes.
  async charge(user: any, id: number, dto: PayMembershipDto) {
    const m = await this.prisma.membership.findFirst({
      where: { id: Number(id), companyId: user.companyId },
    });
    if (!m) throw new NotFoundException('Membresía no encontrada');

    const { start, end } = this.currentMonth();
    const already = await this.prisma.membershipPayment.findFirst({
      where: {
        membershipId: m.id,
        status: Status.ACTIVO,
        paidDate: { gte: start, lt: end },
      },
      select: { id: true },
    });
    if (already)
      throw new BadRequestException('Esta membresía ya se cobró este mes.');

    const amount =
      dto.amount != null && Number(dto.amount) > 0 ? Number(dto.amount) : m.amount;

    const payment = await this.prisma.membershipPayment.create({
      data: {
        membershipId: m.id,
        companyId: user.companyId,
        amount,
        paidDate: new Date(dto.paidDate),
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes?.trim() || null,
      },
    });
    return { success: true, data: payment };
  }

  // Deshace el cobro del mes actual (por si fue error).
  async uncharge(user: any, id: number) {
    const m = await this.prisma.membership.findFirst({
      where: { id: Number(id), companyId: user.companyId },
      select: { id: true },
    });
    if (!m) throw new NotFoundException('Membresía no encontrada');

    const { start, end } = this.currentMonth();
    const payment = await this.prisma.membershipPayment.findFirst({
      where: {
        membershipId: m.id,
        status: Status.ACTIVO,
        paidDate: { gte: start, lt: end },
      },
      orderBy: { paidDate: 'desc' },
      select: { id: true },
    });
    if (!payment)
      throw new BadRequestException('No hay un cobro de este mes para deshacer.');

    await this.prisma.membershipPayment.update({
      where: { id: payment.id },
      data: { status: Status.ELIMINADO },
    });
    return { success: true };
  }
}
