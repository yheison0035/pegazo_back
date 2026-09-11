import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { FiscalService } from '@/fiscal/fiscal.service';

const OBLIGATIONS = ['IVA', 'RENTA', 'RETEFUENTE', 'ICA', 'OTRO'];

// Campos del perfil fiscal que se editan/leen (responsabilidades del RUT).
const PROFILE_SELECT = {
  nit: true,
  dv: true,
  ciiu: true,
  personType: true,
  taxRegime: true,
  responsableIVA: true,
  agenteRetencion: true,
  autorretenedor: true,
  responsableICA: true,
  granContribuyente: true,
  obligadoContabilidad: true,
  facturadorElectronico: true,
} as const;

@Injectable()
export class TaxService {
  constructor(
    private prisma: PrismaService,
    private fiscal: FiscalService,
  ) {}

  // ---------- Perfil fiscal (responsabilidades del RUT) ----------
  private mapPersonType(v?: string | null): 'NATURAL' | 'JURIDICA' {
    return String(v || '').toUpperCase().includes('JUR') ? 'JURIDICA' : 'NATURAL';
  }
  private mapRegime(v?: string | null): 'SIMPLE' | 'ORDINARIO' | 'NO_RESPONSABLE' {
    const s = String(v || '').toUpperCase();
    if (s.includes('SIMPLE')) return 'SIMPLE';
    if (s.includes('NO')) return 'NO_RESPONSABLE';
    return 'ORDINARIO';
  }

  async getProfile(user: any) {
    const c = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: PROFILE_SELECT,
    });
    return { success: true, data: c };
  }

  async updateProfile(user: any, dto: any) {
    const bools = [
      'responsableIVA',
      'agenteRetencion',
      'autorretenedor',
      'responsableICA',
      'granContribuyente',
      'obligadoContabilidad',
      'facturadorElectronico',
    ];
    const data: any = {};
    for (const k of bools) if (dto[k] !== undefined) data[k] = !!dto[k];
    for (const k of ['nit', 'dv', 'ciiu', 'personType', 'taxRegime'])
      if (dto[k] !== undefined) data[k] = dto[k] === '' ? null : String(dto[k]);
    const c = await this.prisma.company.update({
      where: { id: user.companyId },
      data,
      select: PROFILE_SELECT,
    });
    return { success: true, data: c };
  }

  // ---------- Magnitudes anuales (para topes de renta) ----------
  // Ingresos estimados de las ventas del año (el contador puede sobreescribir).
  private async salesIngresos(companyId: number, year: number): Promise<number> {
    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year + 1, 0, 1));
    const agg = await this.prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { local: { companyId }, createdAt: { gte: from, lt: to } },
    });
    return Math.round(Number(agg._sum.totalAmount) || 0);
  }

  async getTaxYear(user: any, yearInput: any) {
    const year = Number(yearInput) || new Date().getUTCFullYear();
    const [row, ingresosVentas] = await Promise.all([
      this.prisma.companyTaxYear.findUnique({
        where: { companyId_year: { companyId: user.companyId, year } },
      }),
      this.salesIngresos(user.companyId, year),
    ]);
    return {
      success: true,
      data: {
        year,
        ingresosVentas,
        ingresosBrutosOverride: row?.ingresosBrutosOverride ?? null,
        patrimonioBruto: row?.patrimonioBruto || 0,
        consumosTarjeta: row?.consumosTarjeta || 0,
        compras: row?.compras || 0,
        consignaciones: row?.consignaciones || 0,
      },
    };
  }

  async updateTaxYear(user: any, dto: any) {
    const year = Number(dto?.year) || new Date().getUTCFullYear();
    const n = (v: any) => (v === '' || v == null ? null : Math.round(Number(v)));
    const patrimonioBruto = n(dto.patrimonioBruto) ?? 0;
    const consumosTarjeta = n(dto.consumosTarjeta) ?? 0;
    const compras = n(dto.compras) ?? 0;
    const consignaciones = n(dto.consignaciones) ?? 0;
    const ingresosBrutosOverride = n(dto.ingresosBrutosOverride);
    const data = {
      patrimonioBruto,
      consumosTarjeta,
      compras,
      consignaciones,
      ingresosBrutosOverride,
    };
    const row = await this.prisma.companyTaxYear.upsert({
      where: { companyId_year: { companyId: user.companyId, year } },
      update: data,
      create: { companyId: user.companyId, year, ...data },
    });
    return { success: true, data: row };
  }

  // ---------- Obligaciones DIAN (motor de la API fiscal) ----------
  async obligations(user: any, query: any = {}) {
    const year = Number(query?.year) || new Date().getUTCFullYear();
    const c = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: PROFILE_SELECT,
    });
    const ty = await this.prisma.companyTaxYear.findUnique({
      where: { companyId_year: { companyId: user.companyId, year } },
    });
    const ingresosVentas = await this.salesIngresos(user.companyId, year);
    const ingresosBrutos = ty?.ingresosBrutosOverride ?? ingresosVentas;
    const responsibilities = {
      responsableIVA: !!c?.responsableIVA,
      agenteRetencion: !!c?.agenteRetencion,
      autorretenedor: !!c?.autorretenedor,
      responsableICA: !!c?.responsableICA,
      granContribuyente: !!c?.granContribuyente,
      obligadoContabilidad: !!c?.obligadoContabilidad,
      facturadorElectronico: !!c?.facturadorElectronico,
    };
    const personType = this.mapPersonType(c?.personType);
    const regime = this.mapRegime(c?.taxRegime);
    const payload = {
      year,
      personType,
      regime,
      responsibilities,
      magnitudes: {
        ingresosBrutos,
        patrimonioBruto: ty?.patrimonioBruto || 0,
        consumosTarjeta: ty?.consumosTarjeta || 0,
        compras: ty?.compras || 0,
        consignaciones: ty?.consignaciones || 0,
      },
    };
    const res = await this.fiscal.taxRules('/tax-rules/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      data: {
        year,
        engineAvailable: !!res,
        profile: { personType, regime, ...responsibilities },
        magnitudes: {
          ...payload.magnitudes,
          ingresosVentas,
          ingresosBrutosOverride: ty?.ingresosBrutosOverride ?? null,
        },
        evaluation: res?.data || null,
      },
    };
  }

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
    const data = await this.buildCalendar(user.companyId, query);
    return { success: true, data };
  }

  // Calcula el calendario que aplica a una empresa (reutilizado por el cron de
  // avisos). Devuelve el objeto de datos (sin envolver en success).
  async buildCalendar(companyId: number, query: any = {}) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
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
      year,
      nitDigit: digit,
      regime,
      uvt: uvt?.value || null,
      deadlines: data,
    };
  }
}
