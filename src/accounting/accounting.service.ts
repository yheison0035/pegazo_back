import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PUC_SIMPLIFICADO } from '@/ledger-accounts/ledger-accounts.seed';

// Códigos del PUC simplificado que usa el motor de asientos.
const ACC = {
  CAJA: '1105',
  BANCOS: '1110',
  CLIENTES: '1305',
  DEP_ACUM: '1592',
  INGRESOS: '4135',
  DEVOLUCIONES: '4175',
  GASTOS: '5105',
  DEP_GASTO: '5160',
};

// Método de pago (enum) → cuenta de dinero donde entra/sale.
function moneyAccountFor(method: string): string {
  if (method === 'EFECTIVO') return ACC.CAJA;
  if (method === 'CREDITO') return ACC.CLIENTES;
  // BANCOLOMBIA, TRANSFERENCIA, DATAFONO, ADDI → banco.
  return ACC.BANCOS;
}

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // Meses enteros transcurridos entre dos fechas (para depreciación).
  private monthsElapsed(from: Date, to: Date): number {
    if (to <= from) return 0;
    let m =
      (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
      (to.getUTCMonth() - from.getUTCMonth());
    if (to.getUTCDate() < from.getUTCDate()) m -= 1;
    return Math.max(0, m);
  }

  // Depreciación acumulada de un activo hasta una fecha (línea recta).
  private accumAt(a: any, date: Date): number {
    const life = a.usefulLifeMonths || 0;
    if (!life) return 0;
    const acq = new Date(a.acquisitionDate);
    if (date <= acq) return 0;
    const cost = a.cost || 0;
    const salvage = a.salvageValue || 0;
    const depreciable = Math.max(0, cost - salvage);
    const monthly = depreciable / life;
    // Si fue dado de baja/vendido antes de la fecha, se congela ahí.
    let end = date;
    if (a.status !== 'ACTIVE' && a.disposalDate) {
      const d = new Date(a.disposalDate);
      if (d < end) end = d;
    }
    const m = Math.min(life, this.monthsElapsed(acq, end));
    return Math.min(depreciable, Math.round(monthly * m));
  }

  // Mapa código→cuenta de la empresa (siembra el PUC si aún no existe).
  private async accountsMap(companyId: number) {
    let accounts = await this.prisma.ledgerAccount.findMany({
      where: { companyId },
    });
    if (accounts.length === 0) {
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
      accounts = await this.prisma.ledgerAccount.findMany({
        where: { companyId },
      });
    }
    const byCode: Record<string, any> = {};
    for (const a of accounts) byCode[a.code] = a;
    return byCode;
  }

  private range(query: any) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
    const firstStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-01`;
    const startStr: string = query.startDate || firstStr;
    const endStr: string = query.endDate || todayStr;
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    return {
      startStr,
      endStr,
      start: new Date(Date.UTC(sy, sm - 1, sd)),
      end: new Date(Date.UTC(ey, em - 1, ed + 1)), // exclusivo
      startMinus1: new Date(Date.UTC(sy, sm - 1, sd - 1)),
      endInclusive: new Date(Date.UTC(ey, em - 1, ed)),
    };
  }

  // Construye los asientos (partida doble) derivados de la operación.
  private async buildEntries(companyId: number, query: any) {
    const r = this.range(query);
    const map = await this.accountsMap(companyId);
    const name = (code: string) => map[code]?.name || code;
    const line = (code: string, debit: number, credit: number) => ({
      code,
      name: name(code),
      debit: Math.round(debit),
      credit: Math.round(credit),
    });

    const [sales, salePayments, expenses, memberships, returns, assets] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: {
            local: { companyId },
            saleDate: { gte: r.start, lt: r.end },
            paymentStatus: { notIn: ['ANULADO', 'RECHAZADA'] as any },
          },
          select: {
            code: true,
            saleDate: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            customer: { select: { name: true } },
          },
          orderBy: { saleDate: 'asc' },
        }),
        this.prisma.salePayment.findMany({
          where: {
            companyId,
            paidAt: { gte: r.start, lt: r.end },
            sale: { paymentMethod: 'CREDITO' as any },
          },
          select: {
            amount: true,
            method: true,
            paidAt: true,
            sale: { select: { code: true } },
          },
          orderBy: { paidAt: 'asc' },
        }),
        this.prisma.expense.findMany({
          where: {
            local: { companyId },
            status: { not: 'ELIMINADO' as any },
            expenseDate: { gte: r.start, lt: r.end },
          },
          select: { concept: true, amount: true, expenseDate: true },
          orderBy: { expenseDate: 'asc' },
        }),
        this.prisma.membershipPayment.findMany({
          where: {
            companyId,
            status: { not: 'ELIMINADO' as any },
            paidDate: { gte: r.start, lt: r.end },
          },
          select: { amount: true, paidDate: true },
          orderBy: { paidDate: 'asc' },
        }),
        this.prisma.return.findMany({
          where: {
            companyId,
            status: 'REGISTRADA' as any,
            createdAt: { gte: r.start, lt: r.end },
          },
          select: { code: true, total: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.asset.findMany({
          where: { companyId, usefulLifeMonths: { not: null } },
        }),
      ]);

    const day = (d: Date) => new Date(d).toISOString().slice(0, 10);
    const entries: any[] = [];

    // Ventas: ingreso al emitirse; el débito va a caja/banco (contado) o a
    // clientes (fiado / crédito).
    for (const s of sales) {
      const total = Math.round(s.totalAmount || 0);
      if (total <= 0) continue;
      const fiado =
        s.paymentMethod === 'CREDITO' ||
        (['FIADO', 'PENDIENTE'] as any).includes(s.paymentStatus);
      const debitAcc = fiado ? ACC.CLIENTES : moneyAccountFor(s.paymentMethod);
      entries.push({
        date: day(s.saleDate),
        type: 'VENTA',
        ref: s.code || 'Venta',
        description: `Venta ${s.code || ''}${s.customer?.name ? ' · ' + s.customer.name : ''}`.trim(),
        lines: [line(debitAcc, total, 0), line(ACC.INGRESOS, 0, total)],
      });
    }

    // Cobros de fiado (abonos): entra dinero, baja la cartera (clientes).
    for (const p of salePayments) {
      const amt = Math.round(Number(p.amount) || 0);
      if (amt <= 0) continue;
      entries.push({
        date: day(p.paidAt),
        type: 'COBRO',
        ref: p.sale?.code || 'Abono',
        description: `Cobro de fiado ${p.sale?.code || ''}`.trim(),
        lines: [
          line(moneyAccountFor(p.method), amt, 0),
          line(ACC.CLIENTES, 0, amt),
        ],
      });
    }

    // Gastos: se cargan al gasto y salen de caja.
    for (const e of expenses) {
      const amt = Math.round(e.amount || 0);
      if (amt <= 0) continue;
      entries.push({
        date: day(e.expenseDate),
        type: 'GASTO',
        ref: 'Gasto',
        description: e.concept || 'Gasto',
        lines: [line(ACC.GASTOS, amt, 0), line(ACC.CAJA, 0, amt)],
      });
    }

    // Membresías / mensualidades: ingreso en caja.
    for (const m of memberships) {
      const amt = Math.round(m.amount || 0);
      if (amt <= 0) continue;
      entries.push({
        date: day(m.paidDate),
        type: 'MEMBRESIA',
        ref: 'Membresía',
        description: 'Pago de membresía / mensualidad',
        lines: [line(ACC.CAJA, amt, 0), line(ACC.INGRESOS, 0, amt)],
      });
    }

    // Devoluciones: baja el ingreso (devoluciones en ventas) y sale dinero.
    for (const d of returns) {
      const amt = Math.round(d.total || 0);
      if (amt <= 0) continue;
      entries.push({
        date: day(d.createdAt),
        type: 'DEVOLUCION',
        ref: d.code || 'Devolución',
        description: `Devolución ${d.code || ''}`.trim(),
        lines: [line(ACC.DEVOLUCIONES, amt, 0), line(ACC.CAJA, 0, amt)],
      });
    }

    // Depreciación del periodo: acumulada al final menos acumulada antes de
    // iniciar el rango, sumada de todos los activos.
    let dep = 0;
    for (const a of assets) {
      dep += this.accumAt(a, r.endInclusive) - this.accumAt(a, r.startMinus1);
    }
    dep = Math.round(dep);
    if (dep > 0) {
      entries.push({
        date: r.endStr,
        type: 'DEPRECIACION',
        ref: 'Depreciación',
        description: 'Depreciación de activos del periodo',
        lines: [line(ACC.DEP_GASTO, dep, 0), line(ACC.DEP_ACUM, 0, dep)],
      });
    }

    // Orden cronológico.
    entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return { entries, map, range: r };
  }

  // Libro diario: asientos por fecha.
  async journal(user: any, query: any = {}) {
    const { entries, range } = await this.buildEntries(user.companyId, query);
    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of entries)
      for (const l of e.lines) {
        totalDebit += l.debit;
        totalCredit += l.credit;
      }
    return {
      success: true,
      data: {
        startDate: range.startStr,
        endDate: range.endStr,
        entries,
        totals: { debit: totalDebit, credit: totalCredit },
      },
    };
  }

  // Libro mayor: movimientos y saldo por cuenta.
  async ledger(user: any, query: any = {}) {
    const { entries, map, range } = await this.buildEntries(
      user.companyId,
      query,
    );
    const acc: Record<string, any> = {};
    for (const e of entries) {
      for (const l of e.lines) {
        if (!acc[l.code]) {
          const m = map[l.code] || {};
          acc[l.code] = {
            code: l.code,
            name: l.name,
            type: m.type || null,
            nature: m.nature || 'DEBIT',
            debit: 0,
            credit: 0,
          };
        }
        acc[l.code].debit += l.debit;
        acc[l.code].credit += l.credit;
      }
    }
    const rows = Object.values(acc).map((a: any) => ({
      ...a,
      balance:
        a.nature === 'CREDIT' ? a.credit - a.debit : a.debit - a.credit,
    }));
    rows.sort((a: any, b: any) => (a.code < b.code ? -1 : 1));
    return {
      success: true,
      data: {
        startDate: range.startStr,
        endDate: range.endStr,
        accounts: rows,
      },
    };
  }
}
