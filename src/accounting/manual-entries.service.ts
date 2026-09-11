import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { assertPeriodOpen } from '@/common/period-close.util';

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
      attachmentUrl: dto.attachmentUrl ? String(dto.attachmentUrl).trim() : null,
      attachmentName: dto.attachmentName ? String(dto.attachmentName).trim().slice(0, 160) : null,
      lines,
    };
  }

  async create(companyId: number, dto: any, accountantId?: number) {
    const v = this.validate(dto);
    // No permitir registrar en un periodo ya cerrado.
    await assertPeriodOpen(this.prisma, companyId, v.date);
    const entry = await this.prisma.journalEntry.create({
      data: {
        companyId,
        date: v.date,
        description: v.description,
        reference: v.reference,
        attachmentUrl: v.attachmentUrl,
        attachmentName: v.attachmentName,
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

  // Importación en lote: cada fila = un asiento balanceado (una cuenta al
  // débito, otra al crédito, por el mismo valor). Valida que las cuentas
  // existan en el PUC de la empresa; reporta errores por fila sin abortar.
  async bulkImport(companyId: number, rows: any[], accountantId?: number) {
    if (!Array.isArray(rows) || rows.length === 0)
      throw new BadRequestException('El archivo no tiene filas.');
    if (rows.length > 2000)
      throw new BadRequestException('Máximo 2000 filas por importación.');

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { companyId },
      select: { code: true, name: true },
    });
    const byCode = new Map(accounts.map((a) => [a.code, a.name]));

    let created = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const rowNo = i + 2; // fila 1 = encabezados
      try {
        const debCode = String(r.cuentaDebito ?? '').trim();
        const creCode = String(r.cuentaCredito ?? '').trim();
        const valor = Math.round(Number(r.valor) || 0);
        if (!debCode || !creCode)
          throw new Error('Faltan las cuentas de débito o crédito.');
        if (!byCode.has(debCode))
          throw new Error(`La cuenta débito ${debCode} no existe en el PUC.`);
        if (!byCode.has(creCode))
          throw new Error(`La cuenta crédito ${creCode} no existe en el PUC.`);
        if (valor <= 0) throw new Error('El valor debe ser mayor a 0.');
        if (!r.fecha) throw new Error('Falta la fecha.');

        await this.create(
          companyId,
          {
            date: r.fecha,
            description: String(r.descripcion ?? '').trim() || 'Importación',
            reference: r.referencia ? String(r.referencia).trim() : null,
            lines: [
              { accountCode: debCode, accountName: byCode.get(debCode), debit: valor, credit: 0 },
              { accountCode: creCode, accountName: byCode.get(creCode), debit: 0, credit: valor },
            ],
          },
          accountantId,
        );
        created++;
      } catch (e: any) {
        errors.push({ row: rowNo, message: e.message || 'Fila inválida.' });
      }
    }

    return { success: true, data: { total: rows.length, created, errors } };
  }

  async remove(companyId: number, id: number) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Asiento no encontrado.');
    await assertPeriodOpen(this.prisma, companyId, entry.date);
    await this.prisma.journalEntry.delete({ where: { id } });
    return { success: true };
  }
}
