import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

// Contabilidad · Fase A — Activos fijos.
// La depreciación y el valor en libros se CALCULAN al vuelo (línea recta), para
// que reflejen la fecha actual sin tener que almacenar filas por mes.
@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  // Meses transcurridos entre dos fechas (por año*12+mes, nunca negativo).
  private monthsBetween(from: Date, to: Date): number {
    const m =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth());
    return Math.max(0, m);
  }

  // Deriva depreciación acumulada, valor en libros y cuota mensual de un activo.
  // Si no tiene vida útil (null/0) el activo NO se deprecia: su valor en libros
  // es siempre el costo (p. ej. terrenos o bienes que el dueño no deprecia).
  private withDepreciation(a: any) {
    const cost = a.cost || 0;
    const salvage = a.salvageValue || 0;
    const life = a.usefulLifeMonths || 0;

    if (!life) {
      return {
        ...a,
        monthlyDepreciation: 0,
        accumulatedDepreciation: 0,
        bookValue: cost,
        monthsElapsed: 0,
        fullyDepreciated: false,
      };
    }

    const depreciable = Math.max(0, cost - salvage);
    const monthly = depreciable / life;

    // Si el activo fue dado de baja/vendido, la depreciación se congela en esa
    // fecha. Si sigue activo, corre hasta hoy.
    const end =
      a.status !== 'ACTIVE' && a.disposalDate
        ? new Date(a.disposalDate)
        : new Date();
    const monthsElapsed = Math.min(
      life,
      this.monthsBetween(new Date(a.acquisitionDate), end),
    );
    const accumulated = Math.min(
      depreciable,
      Math.round(monthly * monthsElapsed),
    );
    const bookValue = cost - accumulated;
    const fullyDepreciated = monthsElapsed >= life;

    return {
      ...a,
      monthlyDepreciation: Math.round(monthly),
      accumulatedDepreciation: accumulated,
      bookValue,
      monthsElapsed,
      fullyDepreciated,
    };
  }

  async findAll(user: any, query: any = {}) {
    const where: any = { companyId: user.companyId };
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.localId) where.localId = Number(query.localId);
    if (query.name)
      where.name = { contains: String(query.name), mode: 'insensitive' };

    const rows = await this.prisma.asset.findMany({
      where,
      orderBy: { acquisitionDate: 'desc' },
    });
    const data = rows.map((r) => this.withDepreciation(r));

    // Resumen para las tarjetas de arriba (y base del futuro estado financiero).
    const active = data.filter((d) => d.status === 'ACTIVE');
    const summary = {
      count: data.length,
      activeCount: active.length,
      totalCost: active.reduce((s, d) => s + (d.cost || 0), 0),
      totalAccumulated: active.reduce(
        (s, d) => s + d.accumulatedDepreciation,
        0,
      ),
      totalBookValue: active.reduce((s, d) => s + d.bookValue, 0),
      // Gasto de depreciación del mes (activos vigentes aún no depreciados del
      // todo). Alimentará el estado de resultados en la siguiente fase.
      monthlyDepreciation: active
        .filter((d) => !d.fullyDepreciated)
        .reduce((s, d) => s + d.monthlyDepreciation, 0),
    };

    return { success: true, data, summary };
  }

  async findOne(user: any, id: number) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!asset) throw new NotFoundException('Activo no encontrado.');
    return { success: true, data: this.withDepreciation(asset) };
  }

  private normalize(dto: any) {
    if (!dto.name || !String(dto.name).trim())
      throw new BadRequestException('El nombre del activo es obligatorio.');
    if (!dto.acquisitionDate)
      throw new BadRequestException('La fecha de compra es obligatoria.');

    // Cantidad + valor unitario → costo total. Se acepta también `cost` directo
    // (compatibilidad), del que se deriva el unitario.
    const quantity = Math.max(1, Math.round(Number(dto.quantity) || 1));
    let unitCost = dto.unitCost != null ? Number(dto.unitCost) : null;
    let cost: number;
    if (unitCost != null && Number.isFinite(unitCost)) {
      if (unitCost < 0)
        throw new BadRequestException('El valor unitario no es válido.');
      cost = Math.round(unitCost) * quantity;
    } else {
      cost = Number(dto.cost);
      if (!Number.isFinite(cost) || cost < 0)
        throw new BadRequestException('El costo no es válido.');
      cost = Math.round(cost);
      unitCost = Math.round(cost / quantity);
    }

    // Vida útil OPCIONAL: vacío/0 = el activo no se deprecia.
    let life: number | null = null;
    if (dto.usefulLifeMonths != null && String(dto.usefulLifeMonths) !== '') {
      const l = Number(dto.usefulLifeMonths);
      if (!Number.isInteger(l) || l < 0)
        throw new BadRequestException('La vida útil (en meses) no es válida.');
      life = l > 0 ? l : null;
    }

    const salvage = Number(dto.salvageValue) || 0;
    if (salvage < 0 || salvage > cost)
      throw new BadRequestException(
        'El valor de salvamento debe estar entre 0 y el costo total.',
      );

    return {
      name: String(dto.name).trim(),
      category: dto.category ? String(dto.category).trim() : null,
      reference: dto.reference ? String(dto.reference).trim() : null,
      acquisitionDate: new Date(dto.acquisitionDate),
      quantity,
      unitCost: Math.round(unitCost),
      cost,
      salvageValue: Math.round(salvage),
      usefulLifeMonths: life,
      method: 'STRAIGHT_LINE',
      localId: dto.localId ? Number(dto.localId) : null,
      notes: dto.notes ? String(dto.notes).trim() : null,
    };
  }

  async create(user: any, dto: any) {
    const data = this.normalize(dto);
    const asset = await this.prisma.asset.create({
      data: { ...data, companyId: user.companyId },
    });
    return { success: true, data: this.withDepreciation(asset) };
  }

  async update(user: any, id: number, dto: any) {
    await this.findOne(user, id); // valida pertenencia
    const data = this.normalize(dto);
    const asset = await this.prisma.asset.update({ where: { id }, data });
    return { success: true, data: this.withDepreciation(asset) };
  }

  // Baja o venta del activo (deja de depreciarse en la fecha indicada).
  async dispose(user: any, id: number, dto: any) {
    await this.findOne(user, id);
    const sold = dto.disposalValue != null && Number(dto.disposalValue) > 0;
    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        status: sold ? 'SOLD' : 'DISPOSED',
        disposalDate: dto.disposalDate ? new Date(dto.disposalDate) : new Date(),
        disposalValue: sold ? Math.round(Number(dto.disposalValue)) : null,
      },
    });
    return { success: true, data: this.withDepreciation(asset) };
  }

  async remove(user: any, id: number) {
    await this.findOne(user, id);
    await this.prisma.asset.delete({ where: { id } });
    return { success: true };
  }
}
