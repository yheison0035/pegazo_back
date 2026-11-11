import { InstallmentFrequency } from '@prisma/client';

// Redondeo a pesos enteros (la app maneja COP sin centavos en caja/cartera).
const peso = (n: number) => Math.round(n);

// Suma `steps` periodos a una fecha según la frecuencia de las cuotas.
export function addPeriod(
  base: Date,
  frequency: InstallmentFrequency,
  steps: number,
): Date {
  const d = new Date(base);
  switch (frequency) {
    case 'SEMANAL':
      d.setDate(d.getDate() + 7 * steps);
      break;
    case 'QUINCENAL':
      d.setDate(d.getDate() + 15 * steps);
      break;
    case 'MENSUAL':
      d.setMonth(d.getMonth() + steps);
      break;
    case 'ANUAL':
      d.setFullYear(d.getFullYear() + steps);
      break;
  }
  return d;
}

export interface CreditPlanInput {
  total: number; // total de la venta (bienes)
  downPayment?: number; // cuota inicial entregada al momento de la venta
  interestPercent?: number; // % de recargo sobre el saldo a financiar
  count: number; // número de cuotas
  frequency: InstallmentFrequency;
  startDate?: Date | string | null; // fecha de la primera cuota
  saleDate: Date; // fecha de la venta (para la primera cuota por defecto)
}

export interface CreditInstallment {
  number: number;
  dueDate: Date;
  amount: number;
}

export interface CreditPlan {
  down: number; // cuota inicial efectiva (acotada al total)
  financedBase: number; // saldo a financiar antes del recargo
  interestAmount: number; // recargo en pesos
  financedTotal: number; // lo que se reparte en cuotas (base + recargo)
  obligation: number; // total + recargo (lo que el cliente paga en total)
  startDate: Date; // primera cuota
  installments: CreditInstallment[];
}

// Construye el cronograma de cuotas de una venta a crédito. La cuota inicial no
// genera recargo y no es una cuota del plan: reduce el saldo a financiar. El
// recargo se aplica sobre ese saldo. La última cuota absorbe el redondeo.
export function buildCreditPlan(input: CreditPlanInput): CreditPlan {
  const total = peso(Math.max(0, Number(input.total) || 0));
  const down = peso(Math.min(Math.max(0, Number(input.downPayment) || 0), total));
  const count = Math.max(1, Math.floor(Number(input.count) || 1));
  const pct = Math.max(0, Number(input.interestPercent) || 0);

  const financedBase = Math.max(0, total - down);
  const interestAmount = peso((financedBase * pct) / 100);
  const financedTotal = financedBase + interestAmount;
  const obligation = total + interestAmount;

  const start = input.startDate
    ? new Date(input.startDate)
    : addPeriod(input.saleDate, input.frequency, 1);

  const installments: CreditInstallment[] = [];
  const per = Math.floor(financedTotal / count);
  let assigned = 0;
  for (let i = 1; i <= count; i++) {
    const isLast = i === count;
    const amount = isLast ? financedTotal - assigned : per;
    assigned += amount;
    installments.push({
      number: i,
      dueDate: addPeriod(start, input.frequency, i - 1),
      amount: peso(amount),
    });
  }

  return {
    down,
    financedBase,
    interestAmount,
    financedTotal,
    obligation,
    startDate: start,
    installments,
  };
}

export interface InstallmentView {
  number: number;
  dueDate: Date;
  amount: number;
  paid: number;
  pending: number;
  status: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';
}

export interface CreditSummary {
  obligation: number; // total + recargo
  paid: number; // suma de abonos (incluye cuota inicial)
  saldo: number; // obligación - abonos
  allocated: number; // abonos aplicados a las cuotas (abonos - cuota inicial)
  nextDueDate: Date | null; // vencimiento de la próxima cuota con saldo
  overdueDays: number; // días de mora de la cuota vencida más antigua con saldo
  installments: InstallmentView[];
}

// Resume el estado del crédito a partir del cronograma y de los abonos. El
// pagado se reparte entre cuotas de la más antigua a la más nueva. La cuota
// inicial (down) ya redujo el saldo a financiar, así que no se reparte.
export function summarizeCredit(params: {
  obligation: number;
  downPayment: number;
  totalPaid: number;
  installments: { number: number; dueDate: Date; amount: number }[];
  now?: Date;
}): CreditSummary {
  const now = params.now || new Date();
  const obligation = peso(params.obligation);
  const down = peso(Math.max(0, params.downPayment || 0));
  const totalPaid = peso(Math.max(0, params.totalPaid || 0));
  const saldo = Math.max(0, obligation - totalPaid);

  // Abonos aplicables a las cuotas (lo pagado por encima de la cuota inicial).
  let remaining = Math.max(0, totalPaid - down);
  const allocated = remaining;

  const ordered = [...params.installments].sort((a, b) => a.number - b.number);
  let nextDueDate: Date | null = null;
  let overdueDays = 0;

  const views: InstallmentView[] = ordered.map((inst) => {
    const amount = peso(inst.amount);
    const paid = Math.min(amount, remaining);
    remaining -= paid;
    const pending = Math.max(0, amount - paid);

    let status: InstallmentView['status'];
    if (pending <= 0) status = 'PAGADA';
    else if (new Date(inst.dueDate).getTime() < now.getTime()) status = 'VENCIDA';
    else if (paid > 0) status = 'PARCIAL';
    else status = 'PENDIENTE';

    if (pending > 0) {
      if (!nextDueDate) nextDueDate = new Date(inst.dueDate);
      if (status === 'VENCIDA') {
        const d = Math.floor(
          (now.getTime() - new Date(inst.dueDate).getTime()) / 86400000,
        );
        if (d > overdueDays) overdueDays = d;
      }
    }

    return { number: inst.number, dueDate: inst.dueDate, amount, paid, pending, status };
  });

  return {
    obligation,
    paid: totalPaid,
    saldo,
    allocated,
    nextDueDate,
    overdueDays,
    installments: views,
  };
}
