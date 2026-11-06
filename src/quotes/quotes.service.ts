import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { SalesService } from '@/sales/sales.service';
import { CreateQuoteDto, ConvertQuoteDto } from './dto/quote.dto';
import {
  getAccessibleLocalIds,
  assertLocalAccess,
} from '@/common/access-locals.util';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) {}

  async create(user: any, dto: CreateQuoteDto) {
    await assertLocalAccess(this.prisma, user, dto.localId);

    const itemsData = dto.items.map((it) => ({
      inventoryVariantId: it.inventoryVariantId ?? null,
      serviceId: it.serviceId ?? null,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      subtotal: it.quantity * it.price,
    }));
    const total = itemsData.reduce((s, i) => s + i.subtotal, 0);

    const quote = await this.prisma.quote.create({
      data: {
        code: `COT-${Date.now()}`,
        localId: dto.localId,
        companyId: user.companyId,
        customerId: dto.customerId ?? null,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        userId: user.id,
        total,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    return { success: true, message: 'Cotización creada', data: quote };
  }

  async findAll(user: any, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId: user.companyId };
    if (query.status) where.status = query.status;
    if (query.code) where.code = { contains: query.code, mode: 'insensitive' };

    // Aislamiento por local.
    const localIds = await getAccessibleLocalIds(this.prisma, user);
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
    }
    if (query.localId && /^\d+$/.test(String(query.localId))) {
      const req = Number(query.localId);
      where.localId = localIds === null || localIds.includes(req) ? req : -1;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          local: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(user: any, id: number) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        customer: true,
        local: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    await assertLocalAccess(this.prisma, user, quote.localId);
    return { success: true, data: quote };
  }

  async setStatus(user: any, id: number, status: 'ACEPTADA' | 'RECHAZADA') {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    await assertLocalAccess(this.prisma, user, quote.localId);
    if (quote.status === 'CONVERTIDA') {
      throw new BadRequestException('La cotización ya fue convertida en venta.');
    }
    await this.prisma.quote.update({ where: { id }, data: { status } });
    return this.findOne(user, id);
  }

  // Convierte la cotización en una venta real (reutiliza la lógica de ventas:
  // descuenta stock, caja, fidelización) y marca la cotización como CONVERTIDA.
  async convert(user: any, id: number, dto: ConvertQuoteDto) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    await assertLocalAccess(this.prisma, user, quote.localId);
    if (quote.status === 'CONVERTIDA') {
      throw new BadRequestException('La cotización ya fue convertida.');
    }
    if (quote.status === 'RECHAZADA') {
      throw new BadRequestException('La cotización está rechazada.');
    }

    const saleItems = quote.items
      .filter((it) => it.inventoryVariantId || it.serviceId)
      .map((it) => ({
        inventoryVariantId: it.inventoryVariantId ?? undefined,
        serviceId: it.serviceId ?? undefined,
        quantity: it.quantity,
      }));

    if (saleItems.length === 0) {
      throw new BadRequestException(
        'La cotización no tiene productos/servicios válidos para facturar.',
      );
    }

    const saleDto: any = {
      paymentMethod: dto.paymentMethod || 'EFECTIVO',
      localId: quote.localId,
      userId: user.id,
      customerId: quote.customerId ?? undefined,
      items: saleItems,
    };

    const sale = await this.salesService.create(saleDto, user);
    const saleId = sale?.data?.id;

    await this.prisma.quote.update({
      where: { id },
      data: { status: 'CONVERTIDA', saleId: saleId ?? null },
    });

    return { success: true, message: 'Cotización convertida en venta', data: sale.data };
  }

  async remove(user: any, id: number) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    await assertLocalAccess(this.prisma, user, quote.localId);
    if (quote.status === 'CONVERTIDA') {
      throw new BadRequestException(
        'No se puede eliminar una cotización ya convertida.',
      );
    }
    await this.prisma.quote.delete({ where: { id } });
    return { success: true, message: 'Cotización eliminada' };
  }
}
