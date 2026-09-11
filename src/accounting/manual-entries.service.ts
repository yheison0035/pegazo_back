import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class ManualEntriesService {
  constructor(private prisma: PrismaService) {}

  // Normaliza y valida un asiento (debe cuadrar).
  private validate(dto: any) {
    if (!dto.date) throw new BadRequestException('La fecha es obligatoria.');
    const description = String(dto.description || '').trim();
    if (!description)
      throw new BadRequestException('La descripción es obligatoria.');
    const rawLines = Array.isArray(dto.lines) ? dto.lines : [];
    const lines = rawLines
      .map((l: any) => ({
        accountCode: String(l.accountCode || '').trim(),
        accountName: l.accountName ? String(l.accountName).trim() : null,
        debit: Math.max(0, Math.round(Number(l.debit) || 0)),
        credit: Math.max(0, Math.round(Number(l.credit) || 0)),
      }))
      .filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0));
    if (lines.length < 2)
      throw new BadRequestException(
        'Un asiento necesita al menos dos líneas (débito y crédito).',
      );
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit)
      throw new BadRequestException(
        `El asiento no cuadra: débitos ${totalDebit} vs créditos ${totalCredit}.`,
      );
    if (totalDebit === 0)
      throw new BadRequestException('El asiento no tiene valores.');
    return {
      date: new Date(dto.date),
      description: description.slice(0, 300),
      reference: dto.reference ? String(dto.reference).trim().slice(0, 100) : null,
      lines,
    };
  }

  async create(companyId: number, dto: any, accountantId?: number) {
    const v = this.validate(dto);
    const entry = await this.prisma.journalEntry.create({
      data: {
        companyId,
        date: v.date,
        description: v.description,
        reference: v.reference,
        createdByAccountantId: accountantId ?? null,
        lines: { create: v.lines },
      },
      include: { lines: true },
    });
    return { success: true, data: entry };
  }

  async list(companyId: number, query: any = {}) {
    const where: any = { companyId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) {
        const [y, m, d] = String(query.endDate).split('-').map(Number);
        where.date.lt = new Date(Date.UTC(y, m - 1, d + 1));
      }
    }
    const data = await this.prisma.journalEntry.findMany({
      where,
      include: { lines: true },
      orderBy: { date: 'desc' },
      take: 300,
    });
    return { success: true, data };
  }

  async remove(companyId: number, id: number) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Asiento no encontrado.');
    await this.prisma.journalEntry.delete({ where: { id } });
    return { success: true };
  }
}
