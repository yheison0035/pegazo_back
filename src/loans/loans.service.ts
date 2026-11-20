import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, Prisma, Status } from '@prisma/client';
import { PrismaService } from '@/prisma.service';
import { AuditService } from '@/audit/audit.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import {
  assertLocalAccess,
  getAccessibleLocalIds,
} from '@/common/access-locals.util';
import { resolveEffectiveModules } from '@/common/effective-modules.util';
import {
  AllocationComponent,
  LoanAmortization,
  LoanFrequency,
  RateConversion,
  allocatePayment,
  buildLoanPlan,
  effectiveAnnualRate,
  reamortizeRemaining,
  resolveInterestRate,
  settlementQuote,
  summarizeLoan,
} from './loan-plan.util';
import {
  CreateLoanDto,
  CreditProfileDto,
  DisburseLoanDto,
  ExtraCapitalDto,
  LoanPaymentDto,
  LoanProductDto,
  LoanSettingsDto,
  RefinanceLoanDto,
  SettleLoanDto,
  SimulateLoanDto,
} from './dto/loan.dto';

// Clave del módulo (igual en el front: navegación /dashboard/prestamos).
export const LOANS_MODULE_KEY = 'prestamos';

// Roles que pueden operar préstamos (el COBRADOR solo su cartera).
export const LOAN_OWNER_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const LOAN_APPROVER_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const LOAN_DISBURSE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CAJA'];
export const LOAN_CREATE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'CAJA'];
export const LOAN_PAY_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CAJA', 'COBRADOR'];

export interface LoanSettings {
  defaultInterestRate: number; // % mensual
  defaultMoraRate: number | null; // null = igual a la tasa
  graceDays: number;
  defaultFrequency: LoanFrequency;
  defaultAmortization: LoanAmortization;
  rateConversion: RateConversion;
  roundTo: number;
  requireApproval: boolean;
  excludeWeekdays: number[];
  allocationOrder: AllocationComponent[];
  usuryRateMonthly: number | null;
  collectorCanRegisterPayments: boolean;
  requireCashForDisbursement: boolean;
  maxTerm: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  remindersEnabled: boolean; // correo de cuota al cliente (cron)
  reminderDaysBefore: number;
  alertsEnabled: boolean; // aviso interno/push de mora a dueño y cobrador
}

export const LOAN_SETTINGS_DEFAULTS: LoanSettings = {
  defaultInterestRate: 0,
  defaultMoraRate: null,
  graceDays: 0,
  defaultFrequency: 'MENSUAL',
  defaultAmortization: 'SIMPLE',
  rateConversion: 'PROPORCIONAL',
  roundTo: 1,
  requireApproval: false,
  excludeWeekdays: [],
  allocationOrder: ['MORA', 'INTERES', 'CAPITAL'],
  usuryRateMonthly: null,
  collectorCanRegisterPayments: true,
  requireCashForDisbursement: false,
  maxTerm: null,
  minAmount: null,
  maxAmount: null,
  remindersEnabled: true,
  reminderDaysBefore: 1,
  alertsEnabled: true,
};
export const LOAN_SETTINGS_KEYS = Object.keys(LOAN_SETTINGS_DEFAULTS);

const num = (v: any) => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: any) =>
  v === null || v === undefined || v === '' ? null : Number(v);
const CO_OFFSET_MS = 5 * 3600 * 1000;

// Fecha "solo día" en UTC a partir de 'YYYY-MM-DD' o de un instante (tomando el
// día calendario de Colombia). Así los vencimientos y la mora se cuentan por
// días calendario, sin que la hora del servidor mueva el resultado.
export function dateOnlyUTC(input?: Date | string | null): Date {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const inst = input ? new Date(input) : new Date();
  const co = new Date(inst.getTime() - CO_OFFSET_MS);
  return new Date(Date.UTC(co.getUTCFullYear(), co.getUTCMonth(), co.getUTCDate()));
}
export const todayCo = () => dateOnlyUTC();
// Día calendario de una fecha YA guardada como solo-día (medianoche UTC): se
// toma tal cual, sin desplazarla a Colombia (eso la correría un día atrás).
export const dayKeyUTC = (d: Date | string) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
};

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Acceso: el módulo debe estar habilitado para la empresa (tipo / manual / plan)
  // ---------------------------------------------------------------------------
  async assertLoansEnabled(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { type: true, enabledModules: true },
    });
    if (!company) throw new ForbiddenException('Empresa no encontrada.');
    const cfg = await this.prisma.businessTypeConfig.findUnique({
      where: { type: company.type },
      select: { modules: true, active: true },
    });
    const effective = resolveEffectiveModules({
      enabledModules: company.enabledModules,
      typeModules: cfg?.active ? cfg.modules : null,
      type: company.type,
    });
    if (!effective.includes(LOANS_MODULE_KEY)) {
      throw new ForbiddenException({
        error: 'MODULE_DISABLED',
        module: LOANS_MODULE_KEY,
        message: 'El módulo de préstamos no está habilitado para tu negocio.',
      });
    }
    await this.planLimits.assertModule(companyId, LOANS_MODULE_KEY);
  }

  private assertRole(user: any, roles: string[], msg = 'No tienes permiso.') {
    if (!roles.includes(user?.role)) throw new ForbiddenException(msg);
  }

  // ---------------------------------------------------------------------------
  // Configuración de la empresa
  // ---------------------------------------------------------------------------
  async getSettings(companyId: number): Promise<LoanSettings> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { loanSettings: true },
    });
    const raw = (company?.loanSettings as any) || {};
    const s: any = { ...LOAN_SETTINGS_DEFAULTS };
    for (const k of LOAN_SETTINGS_KEYS) if (raw[k] !== undefined) s[k] = raw[k];
    if (!Array.isArray(s.excludeWeekdays)) s.excludeWeekdays = [];
    if (!Array.isArray(s.allocationOrder) || !s.allocationOrder.length) {
      s.allocationOrder = [...LOAN_SETTINGS_DEFAULTS.allocationOrder];
    }
    return s as LoanSettings;
  }

  async settings(user: any) {
    await this.assertLoansEnabled(user.companyId);
    return { success: true, data: await this.getSettings(user.companyId) };
  }

  async updateSettings(user: any, dto: LoanSettingsDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const current = await this.getSettings(user.companyId);
    const next: any = { ...current };
    for (const k of LOAN_SETTINGS_KEYS) {
      if ((dto as any)[k] !== undefined) next[k] = (dto as any)[k];
    }
    if (Array.isArray(next.excludeWeekdays)) {
      next.excludeWeekdays = next.excludeWeekdays
        .map(Number)
        .filter((w: number) => Number.isInteger(w) && w >= 0 && w <= 6);
      if (next.excludeWeekdays.length >= 7) {
        throw new BadRequestException('No puedes excluir todos los días de la semana.');
      }
    }
    if (Array.isArray(next.allocationOrder)) {
      const valid = ['MORA', 'INTERES', 'CAPITAL'];
      const order = next.allocationOrder.filter((c: string) => valid.includes(c));
      for (const c of valid) if (!order.includes(c)) order.push(c);
      next.allocationOrder = order;
    }
    await this.prisma.company.update({
      where: { id: user.companyId },
      data: { loanSettings: next },
    });
    await this.audit.log({
      entity: 'loan-settings',
      entityId: user.companyId,
      action: 'UPDATE',
      user,
      changes: { before: current, after: next },
    });
    return { success: true, data: next };
  }

  // ---------------------------------------------------------------------------
  // Productos de crédito
  // ---------------------------------------------------------------------------
  async listProducts(user: any, includeInactive = false) {
    await this.assertLoansEnabled(user.companyId);
    const items = await this.prisma.loanProduct.findMany({
      where: {
        companyId: user.companyId,
        status: includeInactive ? { not: Status.ELIMINADO } : Status.ACTIVO,
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return { success: true, data: items.map((p) => this.productView(p)) };
  }

  private productView(p: any) {
    return {
      ...p,
      interestRate: num(p.interestRate),
      moraRate: numOrNull(p.moraRate),
      minAmount: numOrNull(p.minAmount),
      maxAmount: numOrNull(p.maxAmount),
    };
  }

  async createProduct(user: any, dto: LoanProductDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const p = await this.prisma.loanProduct.create({
      data: {
        companyId: user.companyId,
        name: dto.name.trim(),
        description: dto.description ?? null,
        interestRate: dto.interestRate,
        moraRate: dto.moraRate ?? null,
        graceDays: dto.graceDays ?? 0,
        frequency: (dto.frequency as any) ?? 'MENSUAL',
        amortization: (dto.amortization as any) ?? 'SIMPLE',
        minTerm: dto.minTerm ?? null,
        maxTerm: dto.maxTerm ?? null,
        minAmount: dto.minAmount ?? null,
        maxAmount: dto.maxAmount ?? null,
        roundTo: dto.roundTo ?? 1,
        status: (dto.status as any) ?? 'ACTIVO',
      },
    });
    await this.audit.log({ entity: 'loan-product', entityId: p.id, action: 'CREATE', user });
    return { success: true, data: this.productView(p) };
  }

  async updateProduct(user: any, id: number, dto: Partial<LoanProductDto>) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const exists = await this.prisma.loanProduct.findFirst({
      where: { id, companyId: user.companyId, status: { not: Status.ELIMINADO } },
    });
    if (!exists) throw new NotFoundException('Producto de crédito no encontrado.');
    const data: any = {};
    const keys = [
      'name', 'description', 'interestRate', 'moraRate', 'graceDays', 'frequency',
      'amortization', 'minTerm', 'maxTerm', 'minAmount', 'maxAmount', 'roundTo', 'status',
    ];
    for (const k of keys) if ((dto as any)[k] !== undefined) data[k] = (dto as any)[k];
    if (typeof data.name === 'string') data.name = data.name.trim();
    const p = await this.prisma.loanProduct.update({ where: { id }, data });
    await this.audit.log({ entity: 'loan-product', entityId: id, action: 'UPDATE', user, changes: data });
    return { success: true, data: this.productView(p) };
  }

  async removeProduct(user: any, id: number) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const exists = await this.prisma.loanProduct.findFirst({
      where: { id, companyId: user.companyId, status: { not: Status.ELIMINADO } },
    });
    if (!exists) throw new NotFoundException('Producto de crédito no encontrado.');
    await this.prisma.loanProduct.update({
      where: { id },
      data: { status: Status.ELIMINADO },
    });
    await this.audit.log({ entity: 'loan-product', entityId: id, action: 'DELETE', user });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Perfil crediticio del cliente
  // ---------------------------------------------------------------------------
  private async assertCustomer(companyId: number, customerId: number) {
    const c = await this.prisma.customer.findFirst({
      where: { id: Number(customerId), companyId, status: { not: Status.ELIMINADO } },
      select: { id: true, name: true, document: true, phone: true, localId: true },
    });
    if (!c) throw new BadRequestException('Cliente no encontrado.');
    return c;
  }

  private async assertCompanyUser(companyId: number, userId?: number | null) {
    if (!userId) return null;
    const u = await this.prisma.user.findFirst({
      where: { id: Number(userId), companyId, status: Status.ACTIVO },
      select: { id: true, name: true, role: true },
    });
    if (!u) throw new BadRequestException('Usuario no encontrado en la empresa.');
    return u;
  }

  private async assertProduct(companyId: number, productId?: number | null) {
    if (!productId) return null;
    const p = await this.prisma.loanProduct.findFirst({
      where: { id: Number(productId), companyId, status: { not: Status.ELIMINADO } },
    });
    if (!p) throw new BadRequestException('Producto de crédito no encontrado.');
    return p;
  }

  private profileView(p: any) {
    if (!p) return null;
    return {
      ...p,
      customRate: numOrNull(p.customRate),
      creditLimit: numOrNull(p.creditLimit),
      monthlyIncome: numOrNull(p.monthlyIncome),
      product: p.product ? this.productView(p.product) : null,
    };
  }

  // Capital pendiente del cliente en préstamos activos (para el cupo).
  private async outstandingCapital(companyId: number, customerId: number) {
    const rows = await this.prisma.loanInstallment.findMany({
      where: {
        companyId,
        loan: { customerId, status: { in: ['DESEMBOLSADO'] } },
      },
      select: { capital: true, capitalPaid: true },
    });
    return rows.reduce((a, r) => a + Math.max(0, num(r.capital) - num(r.capitalPaid)), 0);
  }

  async getProfile(user: any, customerId: number) {
    await this.assertLoansEnabled(user.companyId);
    const customer = await this.assertCustomer(user.companyId, customerId);
    const profile = await this.prisma.customerCreditProfile.findFirst({
      where: { customerId: customer.id, companyId: user.companyId },
      include: {
        product: true,
        collector: { select: { id: true, name: true, role: true } },
      },
    });
    const outstanding = await this.outstandingCapital(user.companyId, customer.id);
    const settings = await this.getSettings(user.companyId);
    const rate = resolveInterestRate({
      customerRate: profile?.customRate as any,
      productRate: profile?.product?.interestRate as any,
      companyRate: settings.defaultInterestRate,
    });
    return {
      success: true,
      data: {
        customer,
        profile: this.profileView(profile),
        outstandingCapital: outstanding,
        availableCredit:
          profile?.creditLimit != null
            ? Math.max(0, num(profile.creditLimit) - outstanding)
            : null,
        effectiveRate: rate,
      },
    };
  }

  async upsertProfile(user: any, customerId: number, dto: CreditProfileDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, [...LOAN_OWNER_ROLES, 'ANALISTA']);
    const customer = await this.assertCustomer(user.companyId, customerId);
    if (dto.productId) await this.assertProduct(user.companyId, dto.productId);
    if (dto.collectorId) await this.assertCompanyUser(user.companyId, dto.collectorId);

    const data: any = {};
    const keys = [
      'productId', 'customRate', 'creditLimit', 'riskCategory', 'score', 'monthlyIncome',
      'occupation', 'workplace', 'references', 'guarantorName', 'guarantorDocument',
      'guarantorPhone', 'guarantorAddress', 'collectorId', 'blocked', 'notes',
    ];
    for (const k of keys) if ((dto as any)[k] !== undefined) data[k] = (dto as any)[k];

    const before = await this.prisma.customerCreditProfile.findFirst({
      where: { customerId: customer.id, companyId: user.companyId },
    });
    const profile = before
      ? await this.prisma.customerCreditProfile.update({
          where: { id: before.id },
          data,
          include: { product: true, collector: { select: { id: true, name: true } } },
        })
      : await this.prisma.customerCreditProfile.create({
          data: { ...data, customerId: customer.id, companyId: user.companyId },
          include: { product: true, collector: { select: { id: true, name: true } } },
        });
    await this.audit.log({
      entity: 'credit-profile',
      entityId: profile.id,
      action: before ? 'UPDATE' : 'CREATE',
      user,
      changes: data,
    });
    return { success: true, data: this.profileView(profile) };
  }

  // ---------------------------------------------------------------------------
  // Resolución de términos (cascada) y simulación
  // ---------------------------------------------------------------------------
  private async resolveTerms(companyId: number, dto: SimulateLoanDto) {
    const settings = await this.getSettings(companyId);
    const profile = dto.customerId
      ? await this.prisma.customerCreditProfile.findFirst({
          where: { customerId: Number(dto.customerId), companyId },
          include: { product: true },
        })
      : null;
    const product =
      (dto.productId ? await this.assertProduct(companyId, dto.productId) : null) ||
      profile?.product ||
      null;

    const rate = resolveInterestRate({
      loanRate: dto.interestRate,
      customerRate: profile?.customRate as any,
      productRate: product?.interestRate as any,
      companyRate: settings.defaultInterestRate,
    });
    const moraRate =
      dto.moraRate ??
      numOrNull(product?.moraRate) ??
      settings.defaultMoraRate ??
      rate.rate;
    const graceDays = dto.graceDays ?? product?.graceDays ?? settings.graceDays;
    const frequency = (dto.frequency ||
      product?.frequency ||
      settings.defaultFrequency) as LoanFrequency;
    const amortization = (dto.amortization ||
      product?.amortization ||
      settings.defaultAmortization) as LoanAmortization;
    const roundTo = dto.roundTo ?? product?.roundTo ?? settings.roundTo;

    const warnings: { code: string; message: string }[] = [];
    const principal = Number(dto.principal) || 0;
    const term = Number(dto.termCount) || 0;
    const minA = numOrNull(product?.minAmount) ?? settings.minAmount;
    const maxA = numOrNull(product?.maxAmount) ?? settings.maxAmount;
    const minT = product?.minTerm ?? null;
    const maxT = product?.maxTerm ?? settings.maxTerm;
    if (minA != null && principal < minA)
      warnings.push({ code: 'MIN_AMOUNT', message: `El monto mínimo es $${minA.toLocaleString('es-CO')}.` });
    if (maxA != null && principal > maxA)
      warnings.push({ code: 'MAX_AMOUNT', message: `El monto máximo es $${maxA.toLocaleString('es-CO')}.` });
    if (minT != null && term < minT)
      warnings.push({ code: 'MIN_TERM', message: `El plazo mínimo es ${minT} cuotas.` });
    if (maxT != null && term > maxT)
      warnings.push({ code: 'MAX_TERM', message: `El plazo máximo es ${maxT} cuotas.` });
    if (settings.usuryRateMonthly != null && rate.rate > settings.usuryRateMonthly) {
      warnings.push({
        code: 'USURY',
        message: `La tasa (${rate.rate}% mensual) supera la tasa de referencia configurada (${settings.usuryRateMonthly}% mensual).`,
      });
    }
    if (profile?.blocked) {
      warnings.push({ code: 'BLOCKED', message: 'El cliente está bloqueado para crédito.' });
    }
    let availableCredit: number | null = null;
    if (profile?.creditLimit != null && dto.customerId) {
      const outstanding = await this.outstandingCapital(companyId, Number(dto.customerId));
      availableCredit = Math.max(0, num(profile.creditLimit) - outstanding);
      if (principal > availableCredit) {
        warnings.push({
          code: 'CREDIT_LIMIT',
          message: `Supera el cupo disponible del cliente ($${availableCredit.toLocaleString('es-CO')}).`,
        });
      }
    }

    return {
      settings,
      profile,
      product,
      terms: {
        principal,
        termCount: term,
        interestRate: rate.rate,
        rateSource: rate.source,
        moraRate: Number(moraRate) || 0,
        graceDays: Number(graceDays) || 0,
        frequency,
        amortization,
        roundTo: Number(roundTo) || 1,
        rateConversion: settings.rateConversion,
        excludeWeekdays: settings.excludeWeekdays,
      },
      warnings,
      availableCredit,
    };
  }

  private planFor(terms: any, disbursementDate: Date, firstDueDate?: string | null) {
    return buildLoanPlan({
      principal: terms.principal,
      interestRate: terms.interestRate,
      termCount: terms.termCount,
      frequency: terms.frequency,
      amortization: terms.amortization,
      rateConversion: terms.rateConversion,
      roundTo: terms.roundTo,
      disbursementDate,
      firstDueDate: firstDueDate ? dateOnlyUTC(firstDueDate) : null,
      excludeWeekdays: terms.excludeWeekdays,
    });
  }

  async simulate(user: any, dto: SimulateLoanDto) {
    await this.assertLoansEnabled(user.companyId);
    const r = await this.resolveTerms(user.companyId, dto);
    const plan = this.planFor(
      r.terms,
      dateOnlyUTC(dto.disbursementDate || null),
      dto.firstDueDate,
    );
    return {
      success: true,
      data: {
        terms: r.terms,
        plan,
        warnings: r.warnings,
        availableCredit: r.availableCredit,
        product: r.product ? this.productView(r.product) : null,
        effectiveAnnualRatePercent: Math.round(effectiveAnnualRate(r.terms.interestRate) * 10000) / 100,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Préstamos: creación y ciclo de vida
  // ---------------------------------------------------------------------------
  private async resolveLocalId(user: any, localId?: number | null, fallback?: number | null) {
    if (localId) {
      await assertLocalAccess(this.prisma, user, Number(localId));
      return Number(localId);
    }
    if (user.localId) return user.localId;
    if (fallback) return fallback;
    const first = await this.prisma.local.findFirst({
      where: { companyId: user.companyId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return first?.id ?? null;
  }

  private async nextCode(tx: Prisma.TransactionClient, companyId: number) {
    const count = await tx.loan.count({ where: { companyId } });
    return `PR-${String(count + 1).padStart(6, '0')}`;
  }

  private async openRegister(tx: Prisma.TransactionClient, companyId: number, localId?: number | null) {
    if (!localId) return null;
    return tx.cashRegister.findFirst({
      where: { localId, companyId, status: 'ABIERTA' },
      select: { id: true },
    });
  }

  async create(user: any, dto: CreateLoanDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_CREATE_ROLES);
    const customer = await this.assertCustomer(user.companyId, dto.customerId);
    const r = await this.resolveTerms(user.companyId, dto);

    const blocking = r.warnings.filter((w) =>
      ['BLOCKED', 'CREDIT_LIMIT', 'MIN_AMOUNT', 'MAX_AMOUNT', 'MIN_TERM', 'MAX_TERM'].includes(w.code),
    );
    const canForce = dto.force && LOAN_OWNER_ROLES.includes(user.role);
    if (blocking.length && !canForce) {
      throw new BadRequestException(blocking.map((w) => w.message).join(' '));
    }
    if (r.terms.principal <= 0) throw new BadRequestException('El capital debe ser mayor a 0.');

    const collectorId = dto.collectorId ?? r.profile?.collectorId ?? null;
    if (collectorId) await this.assertCompanyUser(user.companyId, collectorId);
    const localId = await this.resolveLocalId(user, dto.localId, customer.localId);

    // ¿Se desembolsa ya? Solo si la empresa no exige aprobación y el rol puede.
    const wantsNow = dto.disburseNow !== false;
    const canDisburse = LOAN_DISBURSE_ROLES.includes(user.role);
    const disburseNow = wantsNow && !r.settings.requireApproval && canDisburse;

    const disbursementDate = dateOnlyUTC(dto.disbursementDate || null);
    const plan = this.planFor(r.terms, disbursementDate, dto.firstDueDate);

    const loan = await this.prisma.$transaction(async (tx) => {
      let created: any = null;
      for (let attempt = 0; attempt < 3 && !created; attempt++) {
        const code = await this.nextCode(tx, user.companyId);
        try {
          created = await tx.loan.create({
            data: {
              code,
              status: disburseNow ? 'DESEMBOLSADO' : 'SOLICITADO',
              principal: plan.principal,
              interestRate: r.terms.interestRate,
              moraRate: r.terms.moraRate,
              graceDays: r.terms.graceDays,
              frequency: r.terms.frequency as any,
              amortization: r.terms.amortization as any,
              termCount: plan.termCount,
              roundTo: r.terms.roundTo,
              rateSource: r.terms.rateSource,
              totalInterest: plan.totalInterest,
              totalAmount: plan.totalAmount,
              firstDueDate: plan.firstDueDate,
              notes: dto.notes ?? null,
              customerId: customer.id,
              productId: r.product?.id ?? null,
              collectorId,
              localId,
              companyId: user.companyId,
              createdById: user.id ?? null,
              ...(disburseNow
                ? {
                    disbursedAt: new Date(),
                    disbursedById: user.id ?? null,
                    disbursementMethod: dto.disbursementMethod ?? 'EFECTIVO',
                    approvedAt: new Date(),
                    approvedById: user.id ?? null,
                  }
                : {}),
            },
          });
        } catch (e: any) {
          if (e?.code !== 'P2002' || attempt === 2) throw e;
        }
      }

      if (disburseNow) {
        await this.writeInstallments(tx, created.id, user.companyId, plan);
        const mv = await this.cashOut(
          tx,
          user,
          localId,
          plan.principal,
          dto.disbursementMethod ?? 'EFECTIVO',
          `Desembolso préstamo ${created.code}`,
          r.settings,
        );
        if (mv) {
          await tx.loan.update({
            where: { id: created.id },
            data: { disbursementCashMovementId: mv.id },
          });
        }
      }
      return created;
    });

    await this.audit.log({
      entity: 'loan',
      entityId: loan.id,
      action: 'CREATE',
      user,
      changes: { code: loan.code, principal: plan.principal, status: loan.status },
    });
    return this.detail(user, loan.id);
  }

  private async writeInstallments(
    tx: Prisma.TransactionClient,
    loanId: number,
    companyId: number,
    plan: ReturnType<typeof buildLoanPlan>,
  ) {
    await tx.loanInstallment.deleteMany({ where: { loanId } });
    await tx.loanInstallment.createMany({
      data: plan.installments.map((i) => ({
        loanId,
        companyId,
        number: i.number,
        dueDate: i.dueDate,
        capital: i.capital,
        interest: i.interest,
      })),
    });
  }

  // EGRESO de caja por desembolso en efectivo (si hay caja abierta en la sede).
  private async cashOut(
    tx: Prisma.TransactionClient,
    user: any,
    localId: number | null,
    amount: number,
    method: PaymentMethod,
    concept: string,
    settings: LoanSettings,
  ) {
    if (method !== 'EFECTIVO') return null;
    const reg = await this.openRegister(tx, user.companyId, localId);
    if (!reg) {
      if (settings.requireCashForDisbursement) {
        throw new BadRequestException(
          'Debes abrir la caja de la sede para desembolsar en efectivo.',
        );
      }
      return null;
    }
    return tx.cashMovement.create({
      data: {
        cashRegisterId: reg.id,
        type: 'EGRESO',
        amount,
        concept,
        userId: user.id ?? null,
      },
      select: { id: true },
    });
  }

  private async cashIn(
    tx: Prisma.TransactionClient,
    user: any,
    localId: number | null,
    amount: number,
    method: PaymentMethod,
    concept: string,
  ) {
    if (method !== 'EFECTIVO') return null;
    const reg = await this.openRegister(tx, user.companyId, localId);
    if (!reg) return null;
    return tx.cashMovement.create({
      data: {
        cashRegisterId: reg.id,
        type: 'INGRESO',
        amount,
        concept,
        userId: user.id ?? null,
      },
      select: { id: true },
    });
  }

  // Alcance por sede: para el COBRADOR no aplica (ya está acotado a su cartera
  // por collectorId); un cobrador de campo normalmente no tiene sede asignada.
  private async localScope(user: any): Promise<number[] | null> {
    if (user.role === 'COBRADOR') return null;
    return getAccessibleLocalIds(this.prisma, user);
  }

  private async loadLoan(user: any, id: number, opts: { full?: boolean } = {}) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        customer: { select: { id: true, name: true, document: true, phone: true, email: true, address: true, city: true } },
        collector: { select: { id: true, name: true, phone: true } },
        product: true,
        local: { select: { id: true, name: true } },
        installments: { orderBy: { number: 'asc' } },
        ...(opts.full
          ? {
              payments: {
                orderBy: { paidAt: 'desc' },
                include: {
                  createdBy: { select: { id: true, name: true } },
                  annulledBy: { select: { id: true, name: true } },
                },
              },
              createdBy: { select: { id: true, name: true } },
              approvedBy: { select: { id: true, name: true } },
              disbursedBy: { select: { id: true, name: true } },
            }
          : {}),
      },
    });
    if (!loan) throw new NotFoundException('Préstamo no encontrado.');
    // El cobrador solo ve lo que tiene asignado.
    if (user.role === 'COBRADOR' && loan.collectorId !== user.id) {
      throw new ForbiddenException('Este préstamo no está asignado a ti.');
    }
    // Roles de sede: solo préstamos de sus locales.
    const localIds = await this.localScope(user);
    if (localIds !== null && loan.localId && !localIds.includes(loan.localId)) {
      throw new ForbiddenException('No tienes acceso a este préstamo.');
    }
    return loan;
  }

  private loanView(loan: any, now = todayCo()) {
    const summary = summarizeLoan({
      installments: (loan.installments || []).map((i: any) => ({
        id: i.id,
        number: i.number,
        dueDate: i.dueDate,
        capital: num(i.capital),
        interest: num(i.interest),
        capitalPaid: num(i.capitalPaid),
        interestPaid: num(i.interestPaid),
        moraPaid: num(i.moraPaid),
      })),
      moraRate: num(loan.moraRate),
      graceDays: loan.graceDays || 0,
      now,
    });
    return {
      ...loan,
      principal: num(loan.principal),
      interestRate: num(loan.interestRate),
      moraRate: num(loan.moraRate),
      totalInterest: num(loan.totalInterest),
      totalAmount: num(loan.totalAmount),
      product: loan.product ? this.productView(loan.product) : null,
      payments: Array.isArray(loan.payments)
        ? loan.payments.map((p: any) => ({
            ...p,
            amount: num(p.amount),
            capitalApplied: num(p.capitalApplied),
            interestApplied: num(p.interestApplied),
            moraApplied: num(p.moraApplied),
          }))
        : undefined,
      installments: summary.installments,
      summary: {
        ...summary,
        installments: undefined,
        // Un préstamo no desembolsado no tiene deuda aún.
        status: loan.status === 'DESEMBOLSADO' ? summary.status : loan.status,
      },
    };
  }

  async detail(user: any, id: number) {
    await this.assertLoansEnabled(user.companyId);
    const loan = await this.loadLoan(user, id, { full: true });
    return { success: true, data: this.loanView(loan) };
  }

  async list(user: any, q: any = {}) {
    await this.assertLoansEnabled(user.companyId);
    const where: any = { companyId: user.companyId };
    if (user.role === 'COBRADOR') where.collectorId = user.id;
    else if (q.collectorId && /^\d+$/.test(String(q.collectorId))) {
      where.collectorId = Number(q.collectorId);
    }
    const localIds = await this.localScope(user);
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
    }
    if (q.localId && /^\d+$/.test(String(q.localId))) {
      const req = Number(q.localId);
      where.localId = localIds === null || localIds.includes(req) ? req : -1;
    }
    if (q.customerId && /^\d+$/.test(String(q.customerId))) where.customerId = Number(q.customerId);
    if (q.status && q.status !== 'ALL') {
      where.status = String(q.status).includes(',')
        ? { in: String(q.status).split(',') }
        : q.status;
    } else if (!q.status) {
      where.status = { in: ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'] };
    }
    if (q.search) {
      const s = String(q.search).trim();
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { document: { contains: s } } },
        { customer: { phone: { contains: s } } },
      ];
    }
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = dateOnlyUTC(String(q.from));
      if (q.to) {
        const t = dateOnlyUTC(String(q.to));
        t.setUTCDate(t.getUTCDate() + 1);
        where.createdAt.lt = t;
      }
    }

    const rows = await this.prisma.loan.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, document: true, phone: true } },
        collector: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
        installments: { orderBy: { number: 'asc' } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 1000,
    });
    const now = todayCo();
    let items = rows.map((l) => this.loanView(l, now));
    if (q.overdue === 'true' || q.overdue === '1') {
      items = items.filter((i) => i.summary.status === 'EN_MORA');
    }

    const active = items.filter((i) => i.status === 'DESEMBOLSADO');
    const kpis = {
      count: items.length,
      activeCount: active.length,
      portfolio: active.reduce((a, i) => a + i.summary.pendingCapital + i.summary.pendingInterest, 0),
      pendingCapital: active.reduce((a, i) => a + i.summary.pendingCapital, 0),
      pendingInterest: active.reduce((a, i) => a + i.summary.pendingInterest, 0),
      moraAccrued: active.reduce((a, i) => a + i.summary.moraAccrued, 0),
      overdueCount: active.filter((i) => i.summary.status === 'EN_MORA').length,
      overdueAmount: active.reduce((a, i) => a + i.summary.overdueAmount, 0),
      pendingTotal: active.reduce((a, i) => a + i.summary.pendingTotal, 0),
    };
    return { success: true, data: { items, kpis } };
  }

  async approve(user: any, id: number) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_APPROVER_ROLES);
    const loan = await this.loadLoan(user, id);
    if (loan.status !== 'SOLICITADO') {
      throw new BadRequestException('Solo se puede aprobar un préstamo solicitado.');
    }
    await this.prisma.loan.update({
      where: { id },
      data: { status: 'APROBADO', approvedAt: new Date(), approvedById: user.id ?? null },
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { status: { before: 'SOLICITADO', after: 'APROBADO' } } });
    return this.detail(user, id);
  }

  async reject(user: any, id: number, reason?: string) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_APPROVER_ROLES);
    const loan = await this.loadLoan(user, id);
    if (!['SOLICITADO', 'APROBADO'].includes(loan.status)) {
      throw new BadRequestException('Solo se puede rechazar un préstamo no desembolsado.');
    }
    await this.prisma.loan.update({
      where: { id },
      data: { status: 'RECHAZADO', cancelledAt: new Date(), cancelReason: reason ?? null },
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { status: { before: loan.status, after: 'RECHAZADO' }, reason } });
    return this.detail(user, id);
  }

  async disburse(user: any, id: number, dto: DisburseLoanDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_DISBURSE_ROLES);
    const loan = await this.loadLoan(user, id);
    const settings = await this.getSettings(user.companyId);
    if (loan.status === 'SOLICITADO' && settings.requireApproval) {
      throw new BadRequestException('El préstamo debe ser aprobado antes de desembolsar.');
    }
    if (!['SOLICITADO', 'APROBADO'].includes(loan.status)) {
      throw new BadRequestException('El préstamo ya fue desembolsado o no está vigente.');
    }
    const terms = {
      principal: num(loan.principal),
      termCount: loan.termCount,
      interestRate: num(loan.interestRate),
      frequency: loan.frequency,
      amortization: loan.amortization,
      rateConversion: settings.rateConversion,
      roundTo: loan.roundTo,
      excludeWeekdays: settings.excludeWeekdays,
    };
    const disbursementDate = dateOnlyUTC(dto.disbursementDate || null);
    const plan = this.planFor(terms, disbursementDate, dto.firstDueDate);
    const method = dto.method ?? 'EFECTIVO';

    await this.prisma.$transaction(async (tx) => {
      await this.writeInstallments(tx, loan.id, user.companyId, plan);
      const mv = await this.cashOut(tx, user, loan.localId, plan.principal, method, `Desembolso préstamo ${loan.code}`, settings);
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: 'DESEMBOLSADO',
          disbursedAt: new Date(),
          disbursedById: user.id ?? null,
          disbursementMethod: method,
          disbursementCashMovementId: mv?.id ?? null,
          firstDueDate: plan.firstDueDate,
          totalInterest: plan.totalInterest,
          totalAmount: plan.totalAmount,
          approvedAt: loan.approvedAt ?? new Date(),
          approvedById: loan.approvedById ?? user.id ?? null,
        },
      });
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { status: { before: loan.status, after: 'DESEMBOLSADO' }, method } });
    return this.detail(user, id);
  }

  async cancel(user: any, id: number, reason?: string) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const loan = await this.loadLoan(user, id, { full: true });
    const hasPayments = (loan.payments || []).some((p: any) => p.status === 'ACTIVO');
    if (hasPayments) {
      throw new BadRequestException('No se puede anular un préstamo con abonos registrados. Anula primero los abonos.');
    }
    if (['PAGADO', 'ANULADO', 'RECHAZADO'].includes(loan.status)) {
      throw new BadRequestException('El préstamo no se puede anular en su estado actual.');
    }
    await this.prisma.$transaction(async (tx) => {
      // Si el dinero salió por caja, se devuelve a caja como INGRESO.
      if (loan.status === 'DESEMBOLSADO' && loan.disbursementMethod === 'EFECTIVO') {
        await this.cashIn(tx, user, loan.localId, num(loan.principal), 'EFECTIVO', `Anulación desembolso ${loan.code}`);
      }
      await tx.loan.update({
        where: { id },
        data: { status: 'ANULADO', cancelledAt: new Date(), cancelReason: reason ?? null },
      });
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { status: { before: loan.status, after: 'ANULADO' }, reason } });
    return this.detail(user, id);
  }

  // ---------------------------------------------------------------------------
  // Abonos
  // ---------------------------------------------------------------------------
  async addPayment(user: any, id: number, dto: LoanPaymentDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_PAY_ROLES);
    const settings = await this.getSettings(user.companyId);
    if (user.role === 'COBRADOR' && !settings.collectorCanRegisterPayments) {
      throw new ForbiddenException('Los cobradores no pueden registrar abonos en esta empresa.');
    }
    const loan = await this.loadLoan(user, id);
    if (loan.status !== 'DESEMBOLSADO') {
      throw new BadRequestException('Solo se abona a préstamos desembolsados y vigentes.');
    }
    const amount = Math.round(Number(dto.amount) || 0);
    if (amount <= 0) throw new BadRequestException('El abono debe ser mayor a 0.');

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const now = dateOnlyUTC(paidAt);
    const view = this.loanView(loan, now);
    const states = view.installments;
    const pendingTotal = view.summary.pendingTotal;
    if (amount > pendingTotal) {
      throw new BadRequestException(
        `El abono ($${amount.toLocaleString('es-CO')}) supera la deuda a hoy ($${pendingTotal.toLocaleString('es-CO')}).`,
      );
    }
    const alloc = allocatePayment({
      amount,
      installments: states as any,
      order: settings.allocationOrder,
      targetNumber: dto.targetInstallmentNumber ?? null,
    });
    if (alloc.applied <= 0) throw new BadRequestException('No hay saldo pendiente al que aplicar el abono.');
    const method: PaymentMethod = dto.method ?? 'EFECTIVO';

    const result = await this.prisma.$transaction(async (tx) => {
      for (const line of alloc.lines) {
        const inst = states.find((s: any) => s.number === line.number);
        if (!inst?.id) continue;
        const newCap = inst.capitalPaid + line.capital;
        const newInt = inst.interestPaid + line.interest;
        const fullyPaid = newCap >= inst.capital && newInt >= inst.interest;
        await tx.loanInstallment.update({
          where: { id: inst.id },
          data: {
            capitalPaid: newCap,
            interestPaid: newInt,
            moraPaid: inst.moraPaid + line.mora,
            paidAt: fullyPaid ? paidAt : null,
          },
        });
      }
      const mv = await this.cashIn(tx, user, loan.localId, alloc.applied, method, `Abono préstamo ${loan.code}`);
      const payment = await tx.loanPayment.create({
        data: {
          loanId: loan.id,
          companyId: user.companyId,
          amount: alloc.applied,
          method,
          paidAt,
          note: dto.note ?? null,
          capitalApplied: alloc.capitalApplied,
          interestApplied: alloc.interestApplied,
          moraApplied: alloc.moraApplied,
          allocation: alloc.lines as any,
          cashMovementId: mv?.id ?? null,
          createdById: user.id ?? null,
        },
      });
      // ¿Quedó saldado?
      const fresh = await tx.loanInstallment.findMany({ where: { loanId: loan.id } });
      const settled = fresh.every(
        (i) => num(i.capitalPaid) >= num(i.capital) && num(i.interestPaid) >= num(i.interest),
      );
      if (settled) {
        await tx.loan.update({ where: { id: loan.id }, data: { status: 'PAGADO', paidAt } });
      }
      return { payment, settled };
    });

    await this.audit.log({
      entity: 'loan',
      entityId: id,
      action: 'UPDATE',
      user,
      changes: { abono: { before: null, after: alloc.applied }, method },
    });
    const detail = await this.detail(user, id);
    return {
      success: true,
      data: {
        payment: { ...result.payment, amount: num(result.payment.amount) },
        settled: result.settled,
        loan: detail.data,
      },
    };
  }

  async annulPayment(user: any, loanId: number, paymentId: number, reason?: string) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const loan = await this.loadLoan(user, loanId);
    const payment = await this.prisma.loanPayment.findFirst({
      where: { id: paymentId, loanId, companyId: user.companyId },
    });
    if (!payment) throw new NotFoundException('Abono no encontrado.');
    if (payment.status === 'ANULADO') throw new BadRequestException('El abono ya está anulado.');
    const lines: any[] = Array.isArray(payment.allocation) ? (payment.allocation as any[]) : [];

    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const inst = await tx.loanInstallment.findFirst({
          where: { loanId, number: Number(line.number) },
        });
        if (!inst) continue;
        await tx.loanInstallment.update({
          where: { id: inst.id },
          data: {
            capitalPaid: Math.max(0, num(inst.capitalPaid) - num(line.capital)),
            interestPaid: Math.max(0, num(inst.interestPaid) - num(line.interest)),
            moraPaid: Math.max(0, num(inst.moraPaid) - num(line.mora)),
            paidAt: null,
          },
        });
      }
      await tx.loanPayment.update({
        where: { id: paymentId },
        data: {
          status: 'ANULADO',
          annulledAt: new Date(),
          annulledById: user.id ?? null,
          annulReason: reason ?? null,
        },
      });
      if (loan.status === 'PAGADO') {
        await tx.loan.update({ where: { id: loanId }, data: { status: 'DESEMBOLSADO', paidAt: null } });
      }
      // El efectivo sale de caja para que el arqueo cuadre.
      if (payment.method === 'EFECTIVO') {
        await this.cashOut(
          tx, user, loan.localId, num(payment.amount), 'EFECTIVO',
          `Anulación abono préstamo ${loan.code}`,
          { ...LOAN_SETTINGS_DEFAULTS, requireCashForDisbursement: false },
        );
      }
    });
    await this.audit.log({
      entity: 'loan',
      entityId: loanId,
      action: 'UPDATE',
      user,
      changes: { abonoAnulado: { before: num(payment.amount), after: 0 }, paymentId, reason },
    });
    return this.detail(user, loanId);
  }

  async paymentsHistory(user: any, q: any = {}) {
    await this.assertLoansEnabled(user.companyId);
    const where: any = { companyId: user.companyId };
    if (user.role === 'COBRADOR') where.createdById = user.id;
    else if (q.collectorId && /^\d+$/.test(String(q.collectorId))) where.createdById = Number(q.collectorId);
    if (q.loanId && /^\d+$/.test(String(q.loanId))) where.loanId = Number(q.loanId);
    if (q.customerId && /^\d+$/.test(String(q.customerId))) where.loan = { customerId: Number(q.customerId) };
    if (q.status && q.status !== 'ALL') where.status = q.status;
    if (q.from || q.to) {
      where.paidAt = {};
      if (q.from) where.paidAt.gte = dateOnlyUTC(String(q.from));
      if (q.to) {
        const t = dateOnlyUTC(String(q.to));
        t.setUTCDate(t.getUTCDate() + 1);
        where.paidAt.lt = t;
      }
    }
    const localIds = await this.localScope(user);
    if (localIds !== null) {
      where.loan = { ...(where.loan || {}), localId: localIds.length ? { in: localIds } : -1 };
    }
    const rows = await this.prisma.loanPayment.findMany({
      where,
      include: {
        loan: { select: { id: true, code: true, customer: { select: { id: true, name: true, document: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: Math.min(Number(q.limit) || 300, 2000),
    });
    const items = rows.map((p) => ({
      ...p,
      amount: num(p.amount),
      capitalApplied: num(p.capitalApplied),
      interestApplied: num(p.interestApplied),
      moraApplied: num(p.moraApplied),
    }));
    const active = items.filter((p) => p.status === 'ACTIVO');
    return {
      success: true,
      data: {
        items,
        totals: {
          amount: active.reduce((a, p) => a + p.amount, 0),
          capital: active.reduce((a, p) => a + p.capitalApplied, 0),
          interest: active.reduce((a, p) => a + p.interestApplied, 0),
          mora: active.reduce((a, p) => a + p.moraApplied, 0),
          count: active.length,
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Cobrador: ruta del día
  // ---------------------------------------------------------------------------
  async collectorRoute(user: any, q: any = {}) {
    await this.assertLoansEnabled(user.companyId);
    let collectorId = user.id;
    if (user.role !== 'COBRADOR') {
      this.assertRole(user, [...LOAN_OWNER_ROLES, 'COORDINADOR', 'ANALISTA', 'CAJA']);
      if (!q.collectorId) throw new BadRequestException('Indica el cobrador (collectorId).');
      collectorId = Number(q.collectorId);
    }
    const day = dateOnlyUTC(q.date ? String(q.date) : null);
    const dayEnd = new Date(day);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const rows = await this.prisma.loan.findMany({
      where: { companyId: user.companyId, collectorId, status: 'DESEMBOLSADO' },
      include: {
        customer: { select: { id: true, name: true, document: true, phone: true, address: true, city: true } },
        installments: { orderBy: { number: 'asc' } },
      },
    });
    const views = rows.map((l) => this.loanView(l, day));
    // Prioridad para el cobrador: lo que está EN MORA va primero (aunque también
    // tenga cuota hoy); "vencen hoy" son los que están al día y les toca hoy.
    const overdue = views.filter((v) => v.summary.status === 'EN_MORA');
    const dueToday = views.filter(
      (v) =>
        v.summary.status !== 'EN_MORA' &&
        v.installments.some(
          (i: any) => i.status !== 'PAGADA' && dayKeyUTC(i.dueDate) === day.getTime(),
        ),
    );
    const upcoming = views.filter(
      (v) =>
        v.summary.status === 'AL_DIA' &&
        v.summary.nextDueDate &&
        dayKeyUTC(v.summary.nextDueDate) > day.getTime(),
    );
    const sortByLate = (a: any, b: any) => b.summary.overdueDays - a.summary.overdueDays;

    const collected = await this.prisma.loanPayment.findMany({
      where: { companyId: user.companyId, createdById: collectorId, status: 'ACTIVO', paidAt: { gte: day, lt: dayEnd } },
      select: { amount: true, method: true },
    });
    const collectedTotal = collected.reduce((a, p) => a + num(p.amount), 0);
    const collectedCash = collected.filter((p) => p.method === 'EFECTIVO').reduce((a, p) => a + num(p.amount), 0);

    return {
      success: true,
      data: {
        date: day,
        collectorId,
        dueToday: dueToday.sort(sortByLate),
        overdue: overdue.sort(sortByLate),
        upcoming: upcoming.sort(
          (a: any, b: any) => new Date(a.summary.nextDueDate).getTime() - new Date(b.summary.nextDueDate).getTime(),
        ),
        totals: {
          loans: views.length,
          // Lo que hay que cobrar hoy: cuotas de hoy + todo lo vencido.
          toCollectToday:
            dueToday.reduce((a, v) => a + v.summary.nextInstallmentAmount, 0) +
            overdue.reduce((a, v) => a + v.summary.overdueAmount, 0),
          overdueAmount: overdue.reduce((a, v) => a + v.summary.overdueAmount, 0),
          collectedToday: collectedTotal,
          collectedCashToday: collectedCash,
          collectedCount: collected.length,
          portfolio: views.reduce((a, v) => a + v.summary.pendingCapital + v.summary.pendingInterest, 0),
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Resumen / KPIs del módulo
  // ---------------------------------------------------------------------------
  async summary(user: any, q: any = {}) {
    await this.assertLoansEnabled(user.companyId);
    const where: any = { companyId: user.companyId };
    if (user.role === 'COBRADOR') where.collectorId = user.id;
    const localIds = await this.localScope(user);
    if (localIds !== null) where.localId = localIds.length ? { in: localIds } : -1;
    if (q.localId && /^\d+$/.test(String(q.localId))) {
      const req = Number(q.localId);
      where.localId = localIds === null || localIds.includes(req) ? req : -1;
    }

    const now = todayCo();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const tomorrow = new Date(now); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const in7 = new Date(now); in7.setUTCDate(in7.getUTCDate() + 8);

    const loans = await this.prisma.loan.findMany({
      where: { ...where, status: { in: ['DESEMBOLSADO', 'SOLICITADO', 'APROBADO'] } },
      include: { installments: true, customer: { select: { id: true, name: true } }, collector: { select: { id: true, name: true } } },
    });
    const views = loans.map((l) => this.loanView(l, now));
    const active = views.filter((v) => v.status === 'DESEMBOLSADO');
    const overdue = active.filter((v) => v.summary.status === 'EN_MORA');

    const aging = { d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
    for (const v of overdue) {
      const d = v.summary.overdueDays;
      const amt = v.summary.overdueAmount;
      if (d <= 30) aging.d0_30 += amt;
      else if (d <= 60) aging.d31_60 += amt;
      else if (d <= 90) aging.d61_90 += amt;
      else aging.d90p += amt;
    }

    const placedMonth = await this.prisma.loan.aggregate({
      where: { ...where, disbursedAt: { gte: monthStart, lt: nextMonth }, status: { notIn: ['ANULADO', 'RECHAZADO'] } },
      _sum: { principal: true },
      _count: { _all: true },
    });
    const payWhere: any = { companyId: user.companyId, status: 'ACTIVO' };
    if (user.role === 'COBRADOR') payWhere.createdById = user.id;
    if (where.localId !== undefined) payWhere.loan = { localId: where.localId };
    const [payToday, payMonth] = await Promise.all([
      this.prisma.loanPayment.aggregate({
        where: { ...payWhere, paidAt: { gte: now, lt: tomorrow } },
        _sum: { amount: true, interestApplied: true, moraApplied: true, capitalApplied: true },
        _count: { _all: true },
      }),
      this.prisma.loanPayment.aggregate({
        where: { ...payWhere, paidAt: { gte: monthStart, lt: nextMonth } },
        _sum: { amount: true, interestApplied: true, moraApplied: true, capitalApplied: true },
        _count: { _all: true },
      }),
    ]);

    const upcoming = active.filter(
      (v) => v.summary.nextDueDate && new Date(v.summary.nextDueDate) >= tomorrow && new Date(v.summary.nextDueDate) < in7,
    );
    const portfolio = active.reduce((a, v) => a + v.summary.pendingCapital + v.summary.pendingInterest, 0);
    const overdueAmount = overdue.reduce((a, v) => a + v.summary.overdueAmount, 0);

    // Recaudo por cobrador (mes) + comisión sobre lo recaudado.
    const collectedByUser = await this.prisma.loanPayment.groupBy({
      by: ['createdById'],
      where: { ...payWhere, paidAt: { gte: monthStart, lt: nextMonth } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const collectorIds = [...new Set(active.map((v) => v.collectorId).filter(Boolean))] as number[];
    const rates = collectorIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: collectorIds } }, select: { id: true, commissionCollectionRate: true } })
      : [];
    const rateOf = new Map(rates.map((r) => [r.id, numOrNull(r.commissionCollectionRate)]));
    const collectedOf = new Map(collectedByUser.map((c) => [c.createdById ?? 0, { amount: num(c._sum.amount), count: c._count._all }]));
    const byCollectorMap = new Map<string, { id: number | null; name: string; loans: number; portfolio: number; overdue: number; collectedMonth: number; collectedCount: number; commissionRate: number | null; commission: number }>();
    for (const v of active) {
      const key = String(v.collectorId ?? 0);
      const col = collectedOf.get(v.collectorId ?? 0) || { amount: 0, count: 0 };
      const rate = v.collectorId ? rateOf.get(v.collectorId) ?? null : null;
      const cur = byCollectorMap.get(key) || { id: v.collectorId ?? null, name: v.collector?.name || 'Sin cobrador', loans: 0, portfolio: 0, overdue: 0, collectedMonth: col.amount, collectedCount: col.count, commissionRate: rate, commission: rate ? Math.round((col.amount * rate) / 100) : 0 };
      cur.loans += 1;
      cur.portfolio += v.summary.pendingCapital + v.summary.pendingInterest;
      cur.overdue += v.summary.overdueAmount;
      byCollectorMap.set(key, cur);
    }

    return {
      success: true,
      data: {
        portfolio,
        pendingCapital: active.reduce((a, v) => a + v.summary.pendingCapital, 0),
        pendingInterest: active.reduce((a, v) => a + v.summary.pendingInterest, 0),
        moraAccrued: active.reduce((a, v) => a + v.summary.moraAccrued, 0),
        activeLoans: active.length,
        pendingApproval: views.filter((v) => v.status === 'SOLICITADO').length,
        approvedNotDisbursed: views.filter((v) => v.status === 'APROBADO').length,
        overdueLoans: overdue.length,
        overdueAmount,
        moraIndex: portfolio > 0 ? Math.round((overdueAmount / portfolio) * 10000) / 100 : 0,
        aging,
        placedMonth: { amount: num(placedMonth._sum.principal), count: placedMonth._count._all },
        collectedToday: {
          amount: num(payToday._sum.amount), count: payToday._count._all,
          capital: num(payToday._sum.capitalApplied), interest: num(payToday._sum.interestApplied), mora: num(payToday._sum.moraApplied),
        },
        collectedMonth: {
          amount: num(payMonth._sum.amount), count: payMonth._count._all,
          capital: num(payMonth._sum.capitalApplied), interest: num(payMonth._sum.interestApplied), mora: num(payMonth._sum.moraApplied),
        },
        upcoming7: { count: upcoming.length, amount: upcoming.reduce((a, v) => a + v.summary.nextInstallmentAmount, 0) },
        byCollector: [...byCollectorMap.values()].sort((a, b) => b.portfolio - a.portfolio),
        topOverdue: overdue
          .sort((a, b) => b.summary.overdueDays - a.summary.overdueDays)
          .slice(0, 10)
          .map((v) => ({ id: v.id, code: v.code, customer: v.customer, overdueDays: v.summary.overdueDays, overdueAmount: v.summary.overdueAmount, collector: v.collector })),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // FASE 2 · abono a capital, liquidación anticipada, refinanciación, reportes
  // ---------------------------------------------------------------------------
  private termsOf(loan: any, settings: LoanSettings) {
    return {
      interestRate: num(loan.interestRate),
      frequency: loan.frequency as LoanFrequency,
      amortization: loan.amortization as LoanAmortization,
      rateConversion: settings.rateConversion,
      roundTo: loan.roundTo || 1,
      excludeWeekdays: settings.excludeWeekdays,
    };
  }

  // Cotización del abono a capital (sin guardar): cómo quedaría el plan.
  async extraCapitalQuote(user: any, id: number, amount: number, mode: 'REDUCE_INSTALLMENT' | 'REDUCE_TERM') {
    await this.assertLoansEnabled(user.companyId);
    const loan = await this.loadLoan(user, id);
    const settings = await this.getSettings(user.companyId);
    const view = this.loanView(loan);
    if (loan.status !== 'DESEMBOLSADO') throw new BadRequestException('El préstamo no está vigente.');
    if (view.summary.status !== 'AL_DIA' || view.installments.some((i: any) => i.status === 'PARCIAL')) {
      throw new BadRequestException('Para abonar a capital el préstamo debe estar al día (sin cuotas vencidas ni parciales). Primero registra el abono normal.');
    }
    const r = reamortizeRemaining({
      installments: view.installments as any,
      extraCapital: Math.round(Number(amount) || 0),
      mode,
      ...this.termsOf(loan, settings),
    });
    return { success: true, data: { ...r, pendingCapitalBefore: view.summary.pendingCapital } };
  }

  // Abono extraordinario a capital: baja el capital y re-amortiza lo pendiente.
  async extraCapital(user: any, id: number, dto: ExtraCapitalDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, [...LOAN_OWNER_ROLES, 'CAJA']);
    const quote = await this.extraCapitalQuote(user, id, dto.amount, dto.mode);
    const r = quote.data;
    const loan = await this.loadLoan(user, id);
    const amount = Math.round(Number(dto.amount) || 0);
    if (amount <= 0) throw new BadRequestException('El abono debe ser mayor a 0.');
    if (amount > r.pendingCapitalBefore) {
      throw new BadRequestException(`El abono a capital ($${amount.toLocaleString('es-CO')}) supera el capital pendiente ($${r.pendingCapitalBefore.toLocaleString('es-CO')}).`);
    }
    const method: PaymentMethod = dto.method ?? 'EFECTIVO';
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    await this.prisma.$transaction(async (tx) => {
      // Reemplaza las cuotas pendientes por el plan nuevo (las pagadas quedan).
      await tx.loanInstallment.deleteMany({ where: { loanId: loan.id, number: { in: r.removedNumbers } } });
      if (r.newInstallments.length) {
        await tx.loanInstallment.createMany({
          data: r.newInstallments.map((i) => ({
            loanId: loan.id, companyId: user.companyId, number: i.number, dueDate: i.dueDate, capital: i.capital, interest: i.interest,
          })),
        });
      }
      const mv = await this.cashIn(tx, user, loan.localId, amount, method, `Abono a capital préstamo ${loan.code}`);
      await tx.loanPayment.create({
        data: {
          loanId: loan.id, companyId: user.companyId, amount, method, paidAt,
          note: dto.note ?? `Abono a capital (${dto.mode === 'REDUCE_TERM' ? 'acorta plazo' : 'baja cuota'})`,
          capitalApplied: amount, interestApplied: 0, moraApplied: 0,
          allocation: { type: 'CAPITAL_EXTRA', mode: dto.mode, removedNumbers: r.removedNumbers, interestBefore: r.interestBefore, interestAfter: r.interestAfter, installmentBefore: r.installmentBefore, installmentAfter: r.installmentAfter } as any,
          cashMovementId: mv?.id ?? null, createdById: user.id ?? null,
        },
      });
      // Totales del préstamo con el nuevo plan.
      const all = await tx.loanInstallment.findMany({ where: { loanId: loan.id } });
      const totalInterest = all.reduce((a, i) => a + num(i.interest), 0);
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          termCount: all.length,
          totalInterest,
          totalAmount: num(loan.principal) + totalInterest,
          ...(r.settled ? { status: 'PAGADO', paidAt } : {}),
        },
      });
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { abonoCapital: { before: null, after: amount }, mode: dto.mode } });
    return this.detail(user, id);
  }

  async settlementQuote(user: any, id: number) {
    await this.assertLoansEnabled(user.companyId);
    const loan = await this.loadLoan(user, id);
    if (loan.status !== 'DESEMBOLSADO') throw new BadRequestException('El préstamo no está vigente.');
    const view = this.loanView(loan);
    const q = settlementQuote(view.installments as any);
    return { success: true, data: { ...q, pendingTotalNormal: view.summary.pendingTotal } };
  }

  // Liquidación anticipada: paga capital + interés causado + mora; perdona el
  // interés futuro y cierra el préstamo.
  async settle(user: any, id: number, dto: SettleLoanDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, [...LOAN_OWNER_ROLES, 'CAJA']);
    const loan = await this.loadLoan(user, id);
    if (loan.status !== 'DESEMBOLSADO') throw new BadRequestException('El préstamo no está vigente.');
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const view = this.loanView(loan, dateOnlyUTC(paidAt));
    const q = settlementQuote(view.installments as any);
    if (q.total <= 0) throw new BadRequestException('El préstamo no tiene saldo pendiente.');
    const method: PaymentMethod = dto.method ?? 'EFECTIVO';
    const dueSet = new Set(q.installmentNumbersDue);

    await this.prisma.$transaction(async (tx) => {
      for (const inst of view.installments as any[]) {
        if (inst.status === 'PAGADA' || !inst.id) continue;
        const chargeInterest = dueSet.has(inst.number);
        await tx.loanInstallment.update({
          where: { id: inst.id },
          data: {
            capitalPaid: inst.capital,
            // Interés causado se cobra; el futuro se perdona (queda en 0).
            interest: chargeInterest ? inst.interest : inst.interestPaid,
            interestPaid: chargeInterest ? inst.interest : inst.interestPaid,
            moraPaid: inst.moraPaid + inst.moraAccrued,
            paidAt,
          },
        });
      }
      const mv = await this.cashIn(tx, user, loan.localId, q.total, method, `Liquidación préstamo ${loan.code}`);
      await tx.loanPayment.create({
        data: {
          loanId: loan.id, companyId: user.companyId, amount: q.total, method, paidAt,
          note: dto.note ?? 'Liquidación anticipada',
          capitalApplied: q.capital, interestApplied: q.interest, moraApplied: q.mora,
          allocation: { type: 'LIQUIDACION', forgivenInterest: q.forgivenInterest, installmentNumbersDue: q.installmentNumbersDue } as any,
          cashMovementId: mv?.id ?? null, createdById: user.id ?? null,
        },
      });
      const all = await tx.loanInstallment.findMany({ where: { loanId: loan.id } });
      const totalInterest = all.reduce((a, i) => a + num(i.interest), 0);
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'PAGADO', paidAt, totalInterest, totalAmount: num(loan.principal) + totalInterest },
      });
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { liquidacion: { before: null, after: q.total }, perdonado: q.forgivenInterest } });
    return this.detail(user, id);
  }

  // Refinanciar: la deuda a hoy (capital + interés causado + mora, salvo que se
  // perdone) pasa a ser el capital de un préstamo NUEVO con términos nuevos. El
  // viejo queda REFINANCIADO (sin movimiento de caja: no se entrega dinero).
  async refinance(user: any, id: number, dto: RefinanceLoanDto) {
    await this.assertLoansEnabled(user.companyId);
    this.assertRole(user, LOAN_OWNER_ROLES);
    const loan = await this.loadLoan(user, id, { full: true });
    if (loan.status !== 'DESEMBOLSADO') throw new BadRequestException('Solo se refinancia un préstamo vigente.');
    const settings = await this.getSettings(user.companyId);
    const view = this.loanView(loan);
    const q = settlementQuote(view.installments as any);
    const mora = dto.forgiveMora ? 0 : q.mora;
    const principal = q.capital + q.interest + mora;
    if (principal <= 0) throw new BadRequestException('No hay deuda para refinanciar.');

    const terms = {
      principal,
      termCount: dto.termCount,
      interestRate: dto.interestRate ?? num(loan.interestRate),
      rateSource: dto.interestRate != null ? 'LOAN' : loan.rateSource,
      moraRate: num(loan.moraRate),
      graceDays: loan.graceDays,
      frequency: (dto.frequency || loan.frequency) as LoanFrequency,
      amortization: (dto.amortization || loan.amortization) as LoanAmortization,
      roundTo: loan.roundTo,
      rateConversion: settings.rateConversion,
      excludeWeekdays: settings.excludeWeekdays,
    };
    const plan = this.planFor(terms, dateOnlyUTC(null), dto.firstDueDate);

    const created = await this.prisma.$transaction(async (tx) => {
      let newLoan: any = null;
      for (let attempt = 0; attempt < 3 && !newLoan; attempt++) {
        const code = await this.nextCode(tx, user.companyId);
        try {
          newLoan = await tx.loan.create({
            data: {
              code, status: 'DESEMBOLSADO',
              principal: plan.principal, interestRate: terms.interestRate, moraRate: terms.moraRate, graceDays: terms.graceDays,
              frequency: terms.frequency as any, amortization: terms.amortization as any, termCount: plan.termCount, roundTo: terms.roundTo,
              rateSource: terms.rateSource, totalInterest: plan.totalInterest, totalAmount: plan.totalAmount, firstDueDate: plan.firstDueDate,
              notes: dto.notes ?? `Refinanciación de ${loan.code}`,
              customerId: loan.customerId, productId: loan.productId, collectorId: loan.collectorId, localId: loan.localId,
              companyId: user.companyId, createdById: user.id ?? null,
              approvedAt: new Date(), approvedById: user.id ?? null, disbursedAt: new Date(), disbursedById: user.id ?? null,
              disbursementMethod: null, refinancedFromId: loan.id,
            },
          });
        } catch (e: any) {
          if (e?.code !== 'P2002' || attempt === 2) throw e;
        }
      }
      await this.writeInstallments(tx, newLoan.id, user.companyId, plan);
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'REFINANCIADO', cancelledAt: new Date(), cancelReason: `Refinanciado en ${newLoan.code}${dto.forgiveMora && q.mora ? ` (mora perdonada $${q.mora.toLocaleString('es-CO')})` : ''}` },
      });
      return newLoan;
    });
    await this.audit.log({ entity: 'loan', entityId: id, action: 'UPDATE', user, changes: { status: { before: 'DESEMBOLSADO', after: 'REFINANCIADO' }, newLoan: created.code, principal } });
    return this.detail(user, created.id);
  }

  // Reporte mensual: colocación vs recaudo (capital, interés, mora) por mes.
  async reportsMonthly(user: any, q: any = {}) {
    await this.assertLoansEnabled(user.companyId);
    const months = Math.min(24, Math.max(1, Number(q.months) || 6));
    const now = todayCo();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const where: any = { companyId: user.companyId };
    const payWhere: any = { companyId: user.companyId, status: 'ACTIVO', paidAt: { gte: start } };
    if (user.role === 'COBRADOR') {
      where.collectorId = user.id;
      payWhere.createdById = user.id;
    }
    const localIds = await this.localScope(user);
    if (localIds !== null) {
      where.localId = localIds.length ? { in: localIds } : -1;
      payWhere.loan = { localId: where.localId };
    }
    const [loans, payments] = await Promise.all([
      this.prisma.loan.findMany({ where: { ...where, disbursedAt: { gte: start }, status: { notIn: ['ANULADO', 'RECHAZADO'] } }, select: { principal: true, disbursedAt: true } }),
      this.prisma.loanPayment.findMany({ where: payWhere, select: { amount: true, capitalApplied: true, interestApplied: true, moraApplied: true, paidAt: true } }),
    ]);
    const key = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const series: Record<string, any> = {};
    for (let k = 0; k < months; k++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + k, 1));
      series[key(d)] = { month: key(d), placed: 0, placedCount: 0, collected: 0, capital: 0, interest: 0, mora: 0, paymentsCount: 0 };
    }
    for (const l of loans) {
      const k = key(new Date(l.disbursedAt as Date));
      if (series[k]) { series[k].placed += num(l.principal); series[k].placedCount += 1; }
    }
    for (const p of payments) {
      const k = key(new Date(p.paidAt));
      if (series[k]) {
        series[k].collected += num(p.amount); series[k].capital += num(p.capitalApplied);
        series[k].interest += num(p.interestApplied); series[k].mora += num(p.moraApplied); series[k].paymentsCount += 1;
      }
    }
    const rows = Object.values(series);
    return {
      success: true,
      data: {
        months: rows,
        totals: rows.reduce((a: any, r: any) => ({ placed: a.placed + r.placed, collected: a.collected + r.collected, interest: a.interest + r.interest, mora: a.mora + r.mora }), { placed: 0, collected: 0, interest: 0, mora: 0 }),
      },
    };
  }

  // Cobradores activos de la empresa (para asignar cartera). Disponible para
  // todos los roles del módulo: no expone el listado general de usuarios.
  async listCollectors(user: any) {
    await this.assertLoansEnabled(user.companyId);
    const users = await this.prisma.user.findMany({
      where: { companyId: user.companyId, role: 'COBRADOR' as any, status: Status.ACTIVO },
      select: { id: true, name: true, phone: true, localId: true, commissionCollectionRate: true },
      orderBy: { name: 'asc' },
    });
    return {
      success: true,
      data: users.map((u) => ({ ...u, commissionCollectionRate: numOrNull(u.commissionCollectionRate) })),
    };
  }
}
