import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PUC_SIMPLIFICADO } from './ledger-accounts.seed';
import { parseAccountRow } from './ledger-accounts.import.util';

export const MAX_ACCOUNT_IMPORT_ROWS = 2000;

const TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'COST', 'EXPENSE'];
const NATURES = ['DEBIT', 'CREDIT'];

@Injectable()
export class LedgerAccountsService {
  constructor(private prisma: PrismaService) {}

  // Siembra el PUC simplificado la primera vez que la empresa entra al módulo.
  private async ensureSeeded(companyId: number) {
    const count = await this.prisma.ledgerAccount.count({
      where: { companyId },
    });
    if (count > 0) return;
    await this.prisma.ledgerAccount.createMany({
      data: PUC_SIMPLIFICADO.map((a) => ({
        companyId,
        code: a.code,
        name: a.name,
        type: a.type,
        nature: a.nature,
        isBase: true,
        active: true,
      })),
      skipDuplicates: true,
    });
  }

  async findAll(user: any) {
    await this.ensureSeeded(user.companyId);
    const data = await this.prisma.ledgerAccount.findMany({
      where: { companyId: user.companyId },
      orderBy: { code: 'asc' },
    });
    return { success: true, data };
  }

  private validate(dto: any) {
    const code = String(dto.code || '').trim();
    const name = String(dto.name || '').trim();
    if (!code) throw new BadRequestException('El código es obligatorio.');
    if (!name) throw new BadRequestException('El nombre es obligatorio.');
    const type = String(dto.type || '').toUpperCase();
    const nature = String(dto.nature || '').toUpperCase();
    if (!TYPES.includes(type))
      throw new BadRequestException('Tipo de cuenta no válido.');
    if (!NATURES.includes(nature))
      throw new BadRequestException('Naturaleza no válida.');
    return { code, name, type, nature };
  }

  async create(user: any, dto: any) {
    const { code, name, type, nature } = this.validate(dto);
    const dup = await this.prisma.ledgerAccount.findFirst({
      where: { companyId: user.companyId, code },
    });
    if (dup)
      throw new BadRequestException(`Ya existe una cuenta con el código ${code}.`);
    const acc = await this.prisma.ledgerAccount.create({
      data: {
        companyId: user.companyId,
        code,
        name,
        type,
        nature,
        isBase: false,
        active: true,
      },
    });
    return { success: true, data: acc };
  }

  async update(user: any, id: number, dto: any) {
    const acc = await this.prisma.ledgerAccount.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!acc) throw new NotFoundException('Cuenta no encontrada.');
    const { code, name, type, nature } = this.validate(dto);
    if (code !== acc.code) {
      const dup = await this.prisma.ledgerAccount.findFirst({
        where: { companyId: user.companyId, code, id: { not: id } },
      });
      if (dup)
        throw new BadRequestException(
          `Ya existe una cuenta con el código ${code}.`,
        );
    }
    const updated = await this.prisma.ledgerAccount.update({
      where: { id },
      data: {
        code,
        name,
        type,
        nature,
        active: dto.active === undefined ? acc.active : !!dto.active,
      },
    });
    return { success: true, data: updated };
  }

  // Importación en lote del plan de cuentas (Excel/CSV): crea las cuentas que
  // no existen y actualiza el nombre de las que ya están (las cuentas base del
  // PUC conservan grupo y naturaleza para no romper el motor de asientos).
  // Reporta errores por fila sin abortar el resto.
  async bulkImport(user: any, rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0)
      throw new BadRequestException('El archivo no tiene filas.');
    if (rows.length > MAX_ACCOUNT_IMPORT_ROWS)
      throw new BadRequestException(
        `Máximo ${MAX_ACCOUNT_IMPORT_ROWS} filas por importación.`,
      );
    const companyId = user.companyId;
    await this.ensureSeeded(companyId);
    const existing = await this.prisma.ledgerAccount.findMany({
      where: { companyId },
      select: { id: true, code: true, isBase: true },
    });
    const byCode = new Map(existing.map((a) => [a.code, a]));
    const seen = new Set<string>();
    let created = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2;
      try {
        const p = parseAccountRow(rows[i]);
        if (seen.has(p.code))
          throw new Error(`El código ${p.code} está repetido en el archivo.`);
        seen.add(p.code);
        const cur = byCode.get(p.code);
        if (cur) {
          await this.prisma.ledgerAccount.update({
            where: { id: cur.id },
            data: cur.isBase
              ? { name: p.name, active: true }
              : { name: p.name, type: p.type, nature: p.nature, active: true },
          });
          updated++;
        } else {
          const acc = await this.prisma.ledgerAccount.create({
            data: {
              companyId,
              code: p.code,
              name: p.name,
              type: p.type,
              nature: p.nature,
              isBase: false,
              active: true,
            },
          });
          byCode.set(p.code, { id: acc.id, code: acc.code, isBase: false });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: rowNo, message: e.message || 'Fila inválida.' });
      }
    }
    return { success: true, data: { total: rows.length, created, updated, errors } };
  }

  async remove(user: any, id: number) {
    const acc = await this.prisma.ledgerAccount.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!acc) throw new NotFoundException('Cuenta no encontrada.');
    if (acc.isBase)
      throw new BadRequestException(
        'Las cuentas base del PUC no se eliminan; puedes desactivarlas.',
      );
    await this.prisma.ledgerAccount.delete({ where: { id } });
    return { success: true };
  }
}
