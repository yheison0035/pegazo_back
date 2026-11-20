// Motor financiero de PRÉSTAMOS (tipo de negocio FINANCIERA). Es un módulo PURO:
// no depende de Prisma ni de la BD, por eso se puede probar a fondo con Jest y
// reutilizar tal cual en el simulador (sin guardar) y al crear el préstamo.
//
// Es INDEPENDIENTE del fiado de ventas (src/sales/credit-plan.util.ts): no lo
// modifica ni lo reemplaza. Un préstamo entrega dinero (capital), no productos.
//
// Convenciones (las que entiende un prestamista en Colombia):
//  - La tasa SIEMPRE se expresa en % MENSUAL (ej. 3 = 3% mensual) y se convierte
//    al periodo de la cuota según la frecuencia (diaria, semanal, quincenal,
//    mensual). Conversión PROPORCIONAL por defecto (3% mensual = 0,1% diario);
//    EFECTIVA opcional ((1+i)^(días/30) - 1).
//  - La mora se expresa en % MENSUAL sobre el CAPITAL vencido, acumulada por día
//    después de los días de gracia (si se pasa la gracia, se cobra desde el
//    vencimiento).
//  - Todo en pesos enteros (COP sin centavos).

export type LoanFrequency = 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
export type LoanAmortization = 'SIMPLE' | 'FRANCES' | 'ALEMAN';
export type RateConversion = 'PROPORCIONAL' | 'EFECTIVA';
export type AllocationComponent = 'MORA' | 'INTERES' | 'CAPITAL';

export const LOAN_FREQUENCIES: LoanFrequency[] = [
  'DIARIA',
  'SEMANAL',
  'QUINCENAL',
  'MENSUAL',
];
export const LOAN_AMORTIZATIONS: LoanAmortization[] = [
  'SIMPLE',
  'FRANCES',
  'ALEMAN',
];
export const DEFAULT_ALLOCATION_ORDER: AllocationComponent[] = [
  'MORA',
  'INTERES',
  'CAPITAL',
];

// Días que "vale" un periodo de cada frecuencia, para convertir la tasa mensual.
export const PERIOD_DAYS: Record<LoanFrequency, number> = {
  DIARIA: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
};

const peso = (n: number) => Math.round(n);
const DAY_MS = 86400000;

// Redondea al múltiplo indicado (1 = pesos; 100, 500, 1000 para cuotas "bonitas").
export function roundToMultiple(n: number, multiple = 1): number {
  const m = Math.max(1, Math.floor(Number(multiple) || 1));
  if (m === 1) return peso(n);
  return Math.round(n / m) * m;
}

// Suma meses manteniendo el día del mes; si el mes destino es más corto, se
// acota al último día (31 ene + 1 mes = 28/29 feb, no 2/3 mar).
export function addMonthsClamped(base: Date, months: number): Date {
  const d = new Date(base);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

// Si la fecha cae en un día de la semana excluido (ej. domingo = 0), la corre
// hacia adelante hasta el siguiente día permitido.
export function shiftToAllowedWeekday(date: Date, excludeWeekdays: number[] = []): Date {
  if (!excludeWeekdays.length) return date;
  const allowed = new Set([0, 1, 2, 3, 4, 5, 6].filter((w) => !excludeWeekdays.includes(w)));
  if (!allowed.size) return date; // configuración inválida: no corre nada
  const d = new Date(date);
  let guard = 0;
  while (!allowed.has(d.getDay()) && guard++ < 7) d.setDate(d.getDate() + 1);
  return d;
}

// Siguiente vencimiento a partir de `base` según la frecuencia. Para DIARIA se
// avanza al siguiente día PERMITIDO (así un plan "de lunes a sábado" conserva
// el número de cuotas). Para las demás, se suma el periodo y, si cae en un día
// excluido, se corre al siguiente permitido.
export function nextDueDate(
  base: Date,
  frequency: LoanFrequency,
  excludeWeekdays: number[] = [],
): Date {
  const d = new Date(base);
  switch (frequency) {
    case 'DIARIA':
      d.setDate(d.getDate() + 1);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'SEMANAL':
      d.setDate(d.getDate() + 7);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'QUINCENAL':
      d.setDate(d.getDate() + 15);
      return shiftToAllowedWeekday(d, excludeWeekdays);
    case 'MENSUAL':
    default:
      return shiftToAllowedWeekday(addMonthsClamped(d, 1), excludeWeekdays);
  }
}

// Tasa del PERIODO (fracción, no %) a partir de la tasa mensual en %.
export function periodicRate(
  monthlyRatePercent: number,
  frequency: LoanFrequency,
  conversion: RateConversion = 'PROPORCIONAL',
): number {
  const m = Math.max(0, Number(monthlyRatePercent) || 0) / 100;
  const days = PERIOD_DAYS[frequency] ?? 30;
  if (m === 0) return 0;
  if (frequency === 'MENSUAL') return m;
  if (conversion === 'EFECTIVA') return Math.pow(1 + m, days / 30) - 1;
  return (m * days) / 30;
}

// Tasa efectiva anual equivalente (fracción) de una tasa mensual en %. Solo para
// mostrar/comparar (ej. contra la tasa de usura).
export function effectiveAnnualRate(monthlyRatePercent: number): number {
  const m = Math.max(0, Number(monthlyRatePercent) || 0) / 100;
  return Math.pow(1 + m, 12) - 1;
}

export interface LoanPlanInput {
  principal: number; // capital desembolsado
  interestRate: number; // % MENSUAL
  termCount: number; // número de cuotas
  frequency: LoanFrequency;
  amortization?: LoanAmortization; // default SIMPLE
  rateConversion?: RateConversion; // default PROPORCIONAL
  roundTo?: number; // múltiplo para redondear la cuota (1, 100, 1000)
  disbursementDate?: Date | string; // fecha del desembolso (default hoy)
  firstDueDate?: Date | string | null; // primera cuota (default: 1 periodo después)
  excludeWeekdays?: number[]; // 0=Dom..6=Sáb (ej. [0] = no se cobra domingos)
}

export interface LoanPlanInstallment {
  number: number;
  dueDate: Date;
  capital: number;
  interest: number;
  total: number;
  balanceAfter: number; // capital que queda después de esta cuota
}

export interface LoanPlan {
  principal: number;
  interestRate: number; // % mensual
  periodicRatePercent: number; // tasa del periodo en %
  frequency: LoanFrequency;
  amortization: LoanAmortization;
  termCount: number;
  totalInterest: number;
  totalAmount: number; // principal + totalInterest
  installmentAmount: number; // cuota "típica" (la primera)
  firstDueDate: Date;
  lastDueDate: Date;
  effectiveAnnualRatePercent: number;
  installments: LoanPlanInstallment[];
}

function normalizeInput(input: LoanPlanInput) {
  const principal = peso(Math.max(0, Number(input.principal) || 0));
  const termCount = Math.max(1, Math.floor(Number(input.termCount) || 1));
  const interestRate = Math.max(0, Number(input.interestRate) || 0);
  const frequency: LoanFrequency = LOAN_FREQUENCIES.includes(input.frequency)
    ? input.frequency
    : 'MENSUAL';
  const amortization: LoanAmortization = LOAN_AMORTIZATIONS.includes(
    input.amortization as LoanAmortization,
  )
    ? (input.amortization as LoanAmortization)
    : 'SIMPLE';
  const roundTo = Math.max(1, Math.floor(Number(input.roundTo) || 1));
  const excludeWeekdays = Array.isArray(input.excludeWeekdays)
    ? input.excludeWeekdays.filter((w) => Number.isInteger(w) && w >= 0 && w <= 6)
    : [];
  const disb = input.disbursementDate ? new Date(input.disbursementDate) : new Date();
  const first = input.firstDueDate
    ? shiftToAllowedWeekday(new Date(input.firstDueDate), excludeWeekdays)
    : nextDueDate(disb, frequency, excludeWeekdays);
  return {
    principal,
    termCount,
    interestRate,
    frequency,
    amortization,
    roundTo,
    excludeWeekdays,
    first,
    conversion: input.rateConversion === 'EFECTIVA' ? 'EFECTIVA' : 'PROPORCIONAL',
  } as const;
}

function buildDates(first: Date, n: number, frequency: LoanFrequency, excl: number[]) {
  const dates: Date[] = [new Date(first)];
  for (let i = 1; i < n; i++) dates.push(nextDueDate(dates[i - 1], frequency, excl));
  return dates;
}

// Construye el plan de pagos (tabla de amortización) de un préstamo.
//  - SIMPLE: interés sobre el capital inicial durante todo el plazo, cuota fija
//    (capital/n + interés/n). El más usado en microcrédito y cobro diario.
//  - FRANCES: cuota fija, interés sobre saldo (la parte de capital crece).
//  - ALEMAN: capital fijo, interés sobre saldo (la cuota baja).
// Las sumas cierran EXACTAS: Σcapital = principal y Σinterés = totalInterest;
// la última cuota absorbe los redondeos.
export function buildLoanPlan(input: LoanPlanInput): LoanPlan {
  const n = normalizeInput(input);
  const i = periodicRate(n.interestRate, n.frequency, n.conversion);
  const dates = buildDates(n.first, n.termCount, n.frequency, n.excludeWeekdays);
  const P = n.principal;
  const N = n.termCount;

  const rows: LoanPlanInstallment[] = [];

  if (n.amortization === 'FRANCES' && i > 0) {
    const rawA = (P * i) / (1 - Math.pow(1 + i, -N));
    const A = roundToMultiple(rawA, n.roundTo);
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const interest = peso(balance * i);
      let capital = isLast ? balance : Math.min(balance, peso(A - interest));
      if (capital < 0) capital = 0;
      const total = capital + interest;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  } else if (n.amortization === 'ALEMAN' && i > 0) {
    const baseCapital = roundToMultiple(P / N, n.roundTo);
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const interest = peso(balance * i);
      const capital = isLast ? balance : Math.min(balance, baseCapital);
      const total = capital + interest;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  } else {
    // SIMPLE (o cualquier sistema con tasa 0): interés total fijo sobre el capital.
    const totalInterest = peso(P * i * N);
    const totalAmount = P + totalInterest;
    const cuota = roundToMultiple(totalAmount / N, n.roundTo);
    const baseCapital = Math.floor(P / N);
    let capAssigned = 0;
    let totAssigned = 0;
    let balance = P;
    for (let k = 1; k <= N; k++) {
      const isLast = k === N;
      const capital = isLast ? P - capAssigned : baseCapital;
      const total = isLast ? totalAmount - totAssigned : cuota;
      const interest = Math.max(0, total - capital);
      capAssigned += capital;
      totAssigned += total;
      balance = Math.max(0, balance - capital);
      rows.push({ number: k, dueDate: dates[k - 1], capital, interest, total, balanceAfter: balance });
    }
  }

  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const totalAmount = rows.reduce((a, r) => a + r.total, 0);

  return {
    principal: P,
    interestRate: n.interestRate,
    periodicRatePercent: Math.round(i * 100 * 10000) / 10000,
    frequency: n.frequency,
    amortization: n.amortization,
    termCount: N,
    totalInterest,
    totalAmount,
    installmentAmount: rows[0]?.total ?? 0,
    firstDueDate: dates[0],
    lastDueDate: dates[dates.length - 1],
    effectiveAnnualRatePercent:
      Math.round(effectiveAnnualRate(n.interestRate) * 100 * 100) / 100,
    installments: rows,
  };
}

// ---------------------------------------------------------------------------
// MORA
// ---------------------------------------------------------------------------

export interface MoraInput {
  overdueCapital: number; // capital vencido pendiente de la cuota
  dueDate: Date | string;
  now?: Date;
  moraRate: number; // % MENSUAL
  graceDays?: number; // días sin mora; si se superan, se cobra desde el vencimiento
}

// Días calendario de atraso (0 si no ha vencido).
export function daysLate(dueDate: Date | string, now: Date = new Date()): number {
  const due = new Date(dueDate);
  const d = Math.floor((now.getTime() - due.getTime()) / DAY_MS);
  return d > 0 ? d : 0;
}

// Mora acumulada en pesos. Dentro de la gracia no hay mora; pasada la gracia se
// cobra por TODOS los días desde el vencimiento (así funciona la "gracia" en
// el cobro: perdón si pagas a tiempo, no un descuento de días).
export function computeMora(input: MoraInput): number {
  const late = daysLate(input.dueDate, input.now);
  const grace = Math.max(0, Math.floor(Number(input.graceDays) || 0));
  const rate = Math.max(0, Number(input.moraRate) || 0) / 100;
  const base = Math.max(0, Number(input.overdueCapital) || 0);
  if (late <= grace || rate === 0 || base === 0) return 0;
  return peso(base * (rate / 30) * late);
}

// ---------------------------------------------------------------------------
// ESTADO DEL PRÉSTAMO Y ASIGNACIÓN DE ABONOS
// ---------------------------------------------------------------------------

export interface InstallmentState {
  id?: number;
  number: number;
  dueDate: Date | string;
  capital: number;
  interest: number;
  capitalPaid: number;
  interestPaid: number;
  moraPaid: number;
}

export type InstallmentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';

export interface InstallmentView extends InstallmentState {
  total: number;
  pendingCapital: number;
  pendingInterest: number;
  moraAccrued: number; // mora calculada a hoy (sin la ya pagada)
  pendingTotal: number; // capital + interés + mora pendientes
  status: InstallmentStatus;
  daysLate: number;
}

export interface LoanSummary {
  principal: number;
  totalInterest: number;
  totalAmount: number;
  paidCapital: number;
  paidInterest: number;
  paidMora: number;
  paidTotal: number;
  pendingCapital: number;
  pendingInterest: number;
  moraAccrued: number;
  pendingTotal: number; // lo que debe HOY (incluye mora)
  nextDueDate: Date | null;
  nextInstallmentAmount: number;
  overdueInstallments: number;
  overdueAmount: number;
  overdueDays: number; // atraso de la cuota vencida más antigua
  progressPercent: number; // % del capital pagado
  status: 'AL_DIA' | 'EN_MORA' | 'PAGADO';
  installments: InstallmentView[];
}

export function summarizeLoan(params: {
  installments: InstallmentState[];
  moraRate: number;
  graceDays?: number;
  now?: Date;
}): LoanSummary {
  const now = params.now || new Date();
  const ordered = [...params.installments].sort((a, b) => a.number - b.number);

  let principal = 0,
    totalInterest = 0,
    paidCapital = 0,
    paidInterest = 0,
    paidMora = 0,
    pendingCapital = 0,
    pendingInterest = 0,
    moraAccrued = 0,
    overdueInstallments = 0,
    overdueAmount = 0,
    overdueDays = 0;
  let nextDueDate: Date | null = null;
  let nextInstallmentAmount = 0;

  const views: InstallmentView[] = ordered.map((inst) => {
    const capital = peso(inst.capital);
    const interest = peso(inst.interest);
    const cPaid = peso(inst.capitalPaid || 0);
    const iPaid = peso(inst.interestPaid || 0);
    const mPaid = peso(inst.moraPaid || 0);
    const pCap = Math.max(0, capital - cPaid);
    const pInt = Math.max(0, interest - iPaid);
    const late = daysLate(inst.dueDate, now);
    const isPaid = pCap <= 0 && pInt <= 0;
    const mora = isPaid
      ? 0
      : Math.max(
          0,
          computeMora({
            overdueCapital: pCap,
            dueDate: inst.dueDate,
            now,
            moraRate: params.moraRate,
            graceDays: params.graceDays,
          }) - mPaid,
        );
    const pendingTotal = pCap + pInt + mora;

    let status: InstallmentStatus;
    if (isPaid) status = 'PAGADA';
    else if (late > 0) status = 'VENCIDA';
    else if (cPaid > 0 || iPaid > 0) status = 'PARCIAL';
    else status = 'PENDIENTE';

    principal += capital;
    totalInterest += interest;
    paidCapital += cPaid;
    paidInterest += iPaid;
    paidMora += mPaid;
    pendingCapital += pCap;
    pendingInterest += pInt;
    moraAccrued += mora;

    if (!isPaid) {
      if (!nextDueDate) {
        nextDueDate = new Date(inst.dueDate);
        nextInstallmentAmount = pendingTotal;
      }
      if (status === 'VENCIDA') {
        overdueInstallments += 1;
        overdueAmount += pendingTotal;
        if (late > overdueDays) overdueDays = late;
      }
    }

    return {
      ...inst,
      capital,
      interest,
      capitalPaid: cPaid,
      interestPaid: iPaid,
      moraPaid: mPaid,
      total: capital + interest,
      pendingCapital: pCap,
      pendingInterest: pInt,
      moraAccrued: mora,
      pendingTotal,
      status,
      daysLate: isPaid ? 0 : late,
    };
  });

  const pendingTotal = pendingCapital + pendingInterest + moraAccrued;
  const status: LoanSummary['status'] =
    pendingCapital <= 0 && pendingInterest <= 0
      ? 'PAGADO'
      : overdueInstallments > 0
        ? 'EN_MORA'
        : 'AL_DIA';

  return {
    principal,
    totalInterest,
    totalAmount: principal + totalInterest,
    paidCapital,
    paidInterest,
    paidMora,
    paidTotal: paidCapital + paidInterest + paidMora,
    pendingCapital,
    pendingInterest,
    moraAccrued,
    pendingTotal,
    nextDueDate,
    nextInstallmentAmount,
    overdueInstallments,
    overdueAmount,
    overdueDays,
    progressPercent: principal > 0 ? Math.round((paidCapital / principal) * 100) : 0,
    status,
    installments: views,
  };
}

export interface AllocationLine {
  id?: number;
  number: number;
  mora: number;
  interest: number;
  capital: number;
  total: number;
}

export interface AllocationResult {
  lines: AllocationLine[];
  moraApplied: number;
  interestApplied: number;
  capitalApplied: number;
  applied: number;
  leftover: number; // sobrante que no cabe en ninguna cuota
}

// Reparte un abono entre las cuotas. Por defecto: de la cuota más antigua a la
// más nueva, y dentro de cada cuota MORA → INTERÉS → CAPITAL (orden
// configurable). `targetNumber` permite abonar primero a una cuota concreta.
export function allocatePayment(params: {
  amount: number;
  installments: InstallmentView[];
  order?: AllocationComponent[];
  targetNumber?: number | null;
}): AllocationResult {
  let remaining = peso(Math.max(0, Number(params.amount) || 0));
  const order =
    params.order && params.order.length ? params.order : DEFAULT_ALLOCATION_ORDER;

  const pending = params.installments
    .filter((i) => i.status !== 'PAGADA')
    .sort((a, b) => a.number - b.number);
  if (params.targetNumber) {
    const idx = pending.findIndex((i) => i.number === params.targetNumber);
    if (idx > 0) pending.unshift(...pending.splice(idx, 1));
  }

  const lines: AllocationLine[] = [];
  let moraApplied = 0,
    interestApplied = 0,
    capitalApplied = 0;

  for (const inst of pending) {
    if (remaining <= 0) break;
    const line: AllocationLine = {
      id: inst.id,
      number: inst.number,
      mora: 0,
      interest: 0,
      capital: 0,
      total: 0,
    };
    const buckets: Record<AllocationComponent, number> = {
      MORA: inst.moraAccrued,
      INTERES: inst.pendingInterest,
      CAPITAL: inst.pendingCapital,
    };
    for (const comp of order) {
      if (remaining <= 0) break;
      const due = Math.max(0, buckets[comp] || 0);
      if (!due) continue;
      const pay = Math.min(due, remaining);
      remaining -= pay;
      if (comp === 'MORA') line.mora += pay;
      else if (comp === 'INTERES') line.interest += pay;
      else line.capital += pay;
    }
    line.total = line.mora + line.interest + line.capital;
    if (line.total > 0) {
      lines.push(line);
      moraApplied += line.mora;
      interestApplied += line.interest;
      capitalApplied += line.capital;
    }
  }

  return {
    lines,
    moraApplied,
    interestApplied,
    capitalApplied,
    applied: moraApplied + interestApplied + capitalApplied,
    leftover: remaining,
  };
}

// Resuelve la tasa en cascada: préstamo → cliente → producto → empresa.
// Devuelve la tasa (% mensual) y de dónde salió, para mostrarlo en pantalla.
export function resolveInterestRate(params: {
  loanRate?: number | null;
  customerRate?: number | null;
  productRate?: number | null;
  companyRate?: number | null;
}): { rate: number; source: 'LOAN' | 'CUSTOMER' | 'PRODUCT' | 'COMPANY' | 'NONE' } {
  const ok = (v: any) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  if (ok(params.loanRate)) return { rate: Number(params.loanRate), source: 'LOAN' };
  if (ok(params.customerRate)) return { rate: Number(params.customerRate), source: 'CUSTOMER' };
  if (ok(params.productRate)) return { rate: Number(params.productRate), source: 'PRODUCT' };
  if (ok(params.companyRate)) return { rate: Number(params.companyRate), source: 'COMPANY' };
  return { rate: 0, source: 'NONE' };
}
