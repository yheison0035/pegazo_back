import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { assertPeriodOpen } from '@/common/period-close.util';
import {
  cellText,
  groupJournalRows,
  isJournalRow,
  parseAmount,
  type JournalRow,
} from './import-entries.util';

export const MAX_IMPORT_ROWS = 5000;

type Dict = Record<string, unknown>;
type ValidLine = {
  accountCode: string;
  accountName: string | null;
  debit: number;
  credit: number;
};
type ImportError = { row: number; message: string };

const asDict = (v: unknown): Dict =>
  v && typeof v === 'object' ? (v as Dict) : {};
const str = cellText;
const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

@Injectable()
export class ManualEntriesService {
  constructor(private prisma: PrismaService) {}

  // Normaliza y valida un asiento (debe cuadrar).
  private validate(input: unknown) {
    const dto = asDict(input);
    if (!dto.date) throw new BadRequestException('La fecha es obligatoria.');
    const date = new Date(dto.date as string);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('La fecha no es válida.');
    const description = str(dto.description);
    if (!description)
      throw new BadRequestException('La descripción es obligatoria.');
    const rawLines = Array.isArray(dto.lines) ? (dto.lines as unknown[]) : [];
    const lines: ValidLine[] = rawLines
      .map((raw) => {
        const l = asDict(raw);
        return {
          accountCode: str(l.accountCode),
          accountName: l.accountName ? str(l.accountName) : null,
          debit: Math.max(0, Math.round(Number(l.debit) || 0)),
          credit: Math.max(0, Math.round(Number(l.credit) || 0)),
        };
      })
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
      date,
      description: description.slice(0, 300),
      reference: dto.reference ? str(dto.reference).slice(0, 100) : null,
      attachmentUrl: dto.attachmentUrl ? str(dto.attachmentUrl) : null,
      attachmentName: dto.attachmentName
        ? str(dto.attachmentName).slice(0, 160)
        : null,
      lines,
    };
  }

  async create(companyId: number, dto: unknown, accountantId?: number) {
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

  // Edita un asiento completo (cabecera + líneas). Ni la fecha original ni la
  // nueva pueden caer en un periodo cerrado.
  async update(companyId: number, id: number, dto: unknown) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Asiento no encontrado.');
    await assertPeriodOpen(this.prisma, companyId, existing.date);
    const v = this.validate(dto);
    await assertPeriodOpen(this.prisma, companyId, v.date);
    const entry = await this.prisma.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({ where: { entryId: id } });
      return tx.journalEntry.update({
        where: { id },
        data: {
          date: v.date,
          description: v.description,
          reference: v.reference,
          attachmentUrl: v.attachmentUrl,
          attachmentName: v.attachmentName,
          lines: { create: v.lines },
        },
        include: { lines: true },
      });
    });
    return { success: true, data: entry };
  }

  async list(companyId: number, query: Dict = {}) {
    const where: {
      companyId: number;
      date?: { gte?: Date; lt?: Date };
    } = { companyId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(str(query.startDate));
      if (query.endDate) {
        const [y, m, d] = str(query.endDate).split('-').map(Number);
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

  // Importación en lote desde Excel/CSV. Acepta dos formatos (mezclables):
  //  - PAR: cada fila = cuenta débito + cuenta crédito + valor → un asiento.
  //  - DIARIO: cada fila = una línea (cuenta, débito o crédito); las filas se
  //    agrupan por "asiento" (o fecha+descripción+referencia) → un asiento.
  // Valida que las cuentas existan en el PUC de la empresa y reporta errores
  // por fila sin abortar el resto.
  async bulkImport(companyId: number, rows: unknown[], accountantId?: number) {
    if (!Array.isArray(rows) || rows.length === 0)
      throw new BadRequestException('El archivo no tiene filas.');
    if (rows.length > MAX_IMPORT_ROWS)
      throw new BadRequestException(
        `Máximo ${MAX_IMPORT_ROWS} filas por importación.`,
      );

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { companyId },
      select: { code: true, name: true },
    });
    const byCode = new Map(accounts.map((a) => [a.code, a.name]));

    let created = 0;
    const errors: ImportError[] = [];
    const pairRows: (Dict & { rowNo: number })[] = [];
    const journalRows: JournalRow[] = [];
    rows.forEach((r, i) => {
      const rowNo = i + 2; // fila 1 = encabezados
      const d = asDict(r);
      if (isJournalRow(d)) journalRows.push({ ...d, rowNo });
      else pairRows.push({ ...d, rowNo });
    });

    for (const r of pairRows) {
      try {
        const debCode = str(r.cuentaDebito);
        const creCode = str(r.cuentaCredito);
        const valor = parseAmount(r.valor);
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
            description: str(r.descripcion) || 'Importación',
            reference: r.referencia ? str(r.referencia) : null,
            lines: [
              {
                accountCode: debCode,
                accountName: byCode.get(debCode),
                debit: valor,
                credit: 0,
              },
              {
                accountCode: creCode,
                accountName: byCode.get(creCode),
                debit: 0,
                credit: valor,
              },
            ],
          },
          accountantId,
        );
        created++;
      } catch (e) {
        errors.push({ row: r.rowNo, message: errMsg(e, 'Fila inválida.') });
      }
    }

    if (journalRows.length) {
      const grouped = groupJournalRows(journalRows);
      errors.push(...grouped.errors);
      for (const g of grouped.groups) {
        const row = g.rowNos[0];
        try {
          if (!g.date) throw new Error('Falta la fecha.');
          const missing = g.lines
            .map((l) => l.accountCode)
            .filter((c) => !byCode.has(c));
          if (missing.length)
            throw new Error(
              `Cuenta(s) no existen en el PUC: ${[...new Set(missing)].join(', ')}.`,
            );
          await this.create(
            companyId,
            {
              date: g.date,
              description: g.description,
              reference: g.reference,
              lines: g.lines.map((l) => ({
                ...l,
                accountName: byCode.get(l.accountCode),
              })),
            },
            accountantId,
          );
          created++;
        } catch (e) {
          const label =
            g.rowNos.length > 1
              ? `Filas ${g.rowNos[0]}-${g.rowNos[g.rowNos.length - 1]}: `
              : '';
          errors.push({
            row,
            message: label + errMsg(e, 'Asiento inválido.'),
          });
        }
      }
    }

    errors.sort((a, b) => a.row - b.row);
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
