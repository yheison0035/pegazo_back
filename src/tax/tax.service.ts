import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';

const OBLIGATIONS = ['IVA', 'RENTA', 'RETEFUENTE', 'ICA', 'OTRO'];

@Injectable()
export class TaxService {
  constructor(private prisma: PrismaService) {}

  // ---------- Plataforma: calendario ----------
  async listDeadlines(year?: number) {
    const where = year ? { year: Number(year) } : {};
    const data = await this.prisma.taxDeadline.findMany({
      where,
      orderBy: [{ year: 'desc' }, { dueDate: 'asc' }],
    });
    return { success: true, data };
  }

  private validateDeadline(dto: any) {
    const obligation = String(dto.obligation || '').toUpperCase();
    if (!OBLIGATIONS.includes(obligation))
      throw new BadRequestException('Obligación no válida.');
    if (!dto.title || !String(dto.title).trim())
      throw new BadRequestException('El título es obligatorio.');
    if (!dto.dueDate) throw new BadRequestException('La fecha es obligatoria.');
    const year = Number(dto.year) || new Date(dto.dueDate).getUTCFullYear();
    // Normaliza dígitos: solo 0-9 separados por coma.
    const nitDigits = (dto.nitDigits || '')
      .toString()
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => /^[0-9]$/.test(s))
      .join(',');
    const regime = dto.regime ? String(dto.regime).toUpperCase() : null;
    return {
      year,
      obligation,
      title: String(dto.title).trim(),
      period: dto.period ? String(dto.period).trim() : null,
      dueDate: new Date(dto.dueDate),
      nitDigits: nitDigits || null,
      regime,
      notes: dto.notes ? String(dto.notes).trim() : null,
      active: dto.active === undefined ? true : !!dto.active,
    };
  }

  async createDeadline(dto: any) {
    const data = this.validateDeadline(dto);
    const d = await this.prisma.taxDeadline.create({ data });
    return { success: true, data: d };
  }

  async updateDeadline(id: number, dto: any) {
    const data = this.validateDeadline(dto);
    const d = await this.prisma.taxDeadline.update({ where: { id }, data });
    return { success: true, data: d };
  }

  async removeDeadline(id: number) {
    await this.prisma.taxDeadline.delete({ where: { id } });
    return { success: true };
  }

  // ---------- Plataforma: parámetros (UVT) ----------
  async listParameters(year?: number) {
    const where = year ? { year: Number(year) } : {};
    const data = await this.prisma.taxParameter.findMany({
      where,
      orderBy: [{ year: 'desc' }, { key: 'asc' }],
    });
    return { success: true, data };
  }

  async upsertParameter(dto: any) {
    const key = String(dto.key || '').toUpperCase().trim();
    const year = Number(dto.year);
    const value = Math.round(Number(dto.value));
    if (!key) throw new BadRequestException('La clave es obligatoria.');
    if (!year) throw new BadRequestException('El año es obligatorio.');
    if (!Number.isFinite(value)) throw new BadRequestException('Valor no válido.');
    const d = await this.prisma.taxParameter.upsert({
      where: { key_year: { key, year } },
      update: { value },
      create: { key, year, value },
    });
    return { success: true, data: d };
  }

  // ---------- Empresa: su calendario ----------
  // Último dígito numérico del NIT de la empresa.
  private lastNitDigit(nit?: string | null): string | null {
    if (!nit) return null;
    const digits = String(nit).replace(/[^0-9]/g, '');
    return digits ? digits[digits.length - 1] : null;
  }

  async companyCalendar(user: any, query: any = {}) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { nit: true, taxRegime: true },
    });
    const digit = this.lastNitDigit(company?.nit);
    const regime = company?.taxRegime
      ? String(company.taxRegime).toUpperCase()
      : null;

    const now = new Date();
    const year = query.year ? Number(query.year) : now.getUTCFullYear();
    // Trae el año actual y el siguiente (para ver lo que viene en enero).
    const all = await this.prisma.taxDeadline.findMany({
      where: { active: true, year: { in: [year, year + 1] } },
      orderBy: { dueDate: 'asc' },
    });

    const applies = all.filter((d) => {
      // Régimen: si la fecha exige un régimen, debe coincidir.
      if (d.regime && regime && d.regime !== regime) return false;
      // Dígitos: si la fecha exige dígitos y la empresa tiene NIT, debe estar.
      if (d.nitDigits && digit) {
        const list = d.nitDigits.split(',').map((s) => s.trim());
        if (!list.includes(digit)) return false;
      }
      return true;
    });

    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const data = applies.map((d) => {
      const due = new Date(d.dueDate);
      const dueDay = new Date(
        Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()),
      );
      const daysLeft = Math.round(
        (dueDay.getTime() - today.getTime()) / 86400000,
      );
      return {
        id: d.id,
        obligation: d.obligation,
        title: d.title,
        period: d.period,
        dueDate: d.dueDate,
        notes: d.notes,
        daysLeft,
        status: daysLeft < 0 ? 'VENCIDO' : daysLeft <= 8 ? 'PROXIMO' : 'PENDIENTE',
      };
    });

    const uvt = await this.prisma.taxParameter.findUnique({
      where: { key_year: { key: 'UVT', year } },
    });

    return {
      success: true,
      data: {
        year,
        nitDigit: digit,
        regime,
        uvt: uvt?.value || null,
        deadlines: data,
      },
    };
  }
}
