import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PushService } from '@/push/push.service';
import { LoansService, LoanSettings, todayCo } from './loans.service';
import { summarizeLoan } from './loan-plan.util';

const DAY = 86400000;
const THROTTLE_DAYS = 6; // no repetir el correo al mismo cliente antes de ~1 semana
const num = (v: any) => (v === null || v === undefined ? 0 : Number(v));
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');

// Recordatorios y alertas de préstamos (tipo FINANCIERA):
//  - 8:00 a.m. Colombia: correo al CLIENTE con la cuota próxima/vencida
//    (reutiliza la plantilla del recordatorio de crédito; opt-in por empresa).
//  - 9:00 a.m. Colombia: aviso interno + push al dueño (resumen de mora) y a
//    cada COBRADOR (su cartera en mora y lo que vence hoy).
// Ningún fallo tumba el cron: cada empresa/préstamo se procesa por separado.
@Injectable()
export class LoanRemindersService {
  private readonly logger = new Logger(LoanRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly loans: LoansService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  // Empresas que tienen el módulo de préstamos (tipo o manual) y préstamos vivos.
  private async companiesWithLoans() {
    const rows = await this.prisma.loan.groupBy({
      by: ['companyId'],
      where: { status: 'DESEMBOLSADO' },
    });
    if (!rows.length) return [];
    return this.prisma.company.findMany({
      where: { id: { in: rows.map((r) => r.companyId) }, status: 'ACTIVO' as any },
      omit: { mailPassword: false },
    });
  }

  private summaryOf(loan: any, now: Date) {
    return summarizeLoan({
      installments: loan.installments.map((i: any) => ({
        id: i.id, number: i.number, dueDate: i.dueDate,
        capital: num(i.capital), interest: num(i.interest),
        capitalPaid: num(i.capitalPaid), interestPaid: num(i.interestPaid), moraPaid: num(i.moraPaid),
      })),
      moraRate: num(loan.moraRate),
      graceDays: loan.graceDays || 0,
      now,
    });
  }

  private buildSmtp(company: any) {
    return company.mailHost
      ? {
          host: company.mailHost, port: company.mailPort, user: company.mailUser, pass: company.mailPassword,
          fromEmail: company.mailFromEmail, fromName: company.mailFromName || company.name,
        }
      : undefined;
  }

  private async deliverEmail(loan: any, company: any, s: ReturnType<typeof summarizeLoan>) {
    const next = s.installments.find((i) => i.status !== 'PAGADA');
    if (!next || !s.nextDueDate) return null;
    return this.mail.sendCreditReminder({
      to: loan.customer.email,
      companyName: company.mailFromName || company.name || 'Tu negocio',
      smtp: this.buildSmtp(company),
      brandColor: company.primaryColor,
      logo: company.logo || null,
      customerName: loan.customer?.name || null,
      saleCode: loan.code,
      installmentLabel: `Cuota ${next.number} de ${s.installments.length}`,
      dueDate: new Date(s.nextDueDate),
      overdue: s.overdueDays > 0,
      overdueDays: s.overdueDays,
      amount: next.pendingTotal,
      saldo: s.pendingTotal,
      supportEmail: company.email || company.mailFromEmail || null,
      supportPhone: company.phone || null,
      kind: 'préstamo',
    });
  }

  // ───────── 8:00 a.m. Colombia: correo al cliente ─────────
  @Cron('0 13 * * *')
  async runCustomerReminders() {
    try {
      const companies = await this.companiesWithLoans();
      const now = new Date();
      const today = todayCo();
      for (const company of companies) {
        let settings: LoanSettings;
        try {
          settings = await this.loans.getSettings(company.id);
        } catch {
          continue;
        }
        if (!settings.remindersEnabled) continue;
        const windowMs = Math.max(0, Math.min(60, Number(settings.reminderDaysBefore) || 0)) * DAY;
        let loans: any[] = [];
        try {
          loans = await this.prisma.loan.findMany({
            where: { companyId: company.id, status: 'DESEMBOLSADO', customer: { is: { email: { not: null } } } },
            include: { customer: { select: { id: true, name: true, email: true } }, installments: true },
          });
        } catch {
          continue;
        }
        for (const loan of loans) {
          const email = loan.customer?.email?.trim();
          if (!email) continue;
          const s = this.summaryOf(loan, today);
          if (!s.nextDueDate || s.pendingTotal <= 0) continue;
          if (new Date(s.nextDueDate).getTime() - today.getTime() > windowMs) continue;
          if (loan.reminderSentAt && now.getTime() - new Date(loan.reminderSentAt).getTime() < THROTTLE_DAYS * DAY) continue;
          try {
            await this.deliverEmail({ ...loan, customer: { ...loan.customer, email } }, company, s);
            await this.prisma.loan.update({ where: { id: loan.id }, data: { reminderSentAt: now } });
          } catch (e) {
            this.logger.warn(`Recordatorio de préstamo falló (${loan.code}): ${e}`);
          }
        }
      }
    } catch {
      /* el cron nunca tumba la app */
    }
  }

  // ───────── 9:00 a.m. Colombia: alertas internas (dueño y cobradores) ─────────
  @Cron('0 14 * * *')
  async runInternalAlerts() {
    try {
      const companies = await this.companiesWithLoans();
      const today = todayCo();
      for (const company of companies) {
        let settings: LoanSettings;
        try {
          settings = await this.loans.getSettings(company.id);
        } catch {
          continue;
        }
        if (!settings.alertsEnabled) continue;
        const loans = await this.prisma.loan.findMany({
          where: { companyId: company.id, status: 'DESEMBOLSADO' },
          include: { installments: true, customer: { select: { name: true } } },
        });
        let overdueCount = 0, overdueAmount = 0, dueTodayCount = 0, dueTodayAmount = 0;
        const byCollector = new Map<number, { overdue: number; overdueAmt: number; today: number; todayAmt: number }>();
        for (const loan of loans) {
          const s = this.summaryOf(loan, today);
          const dueToday = s.installments.some((i) => i.status !== 'PAGADA' && new Date(i.dueDate).getTime() === today.getTime());
          const g = loan.collectorId ? byCollector.get(loan.collectorId) || { overdue: 0, overdueAmt: 0, today: 0, todayAmt: 0 } : null;
          if (s.status === 'EN_MORA') {
            overdueCount++; overdueAmount += s.overdueAmount;
            if (g) { g.overdue++; g.overdueAmt += s.overdueAmount; }
          }
          if (dueToday) {
            dueTodayCount++; dueTodayAmount += s.nextInstallmentAmount;
            if (g) { g.today++; g.todayAmt += s.nextInstallmentAmount; }
          }
          if (g && loan.collectorId) byCollector.set(loan.collectorId, g);
        }
        if (overdueCount || dueTodayCount) {
          const parts: string[] = [];
          if (overdueCount) parts.push(`${overdueCount} en mora (${fmt(overdueAmount)})`);
          if (dueTodayCount) parts.push(`${dueTodayCount} cuota${dueTodayCount > 1 ? 's' : ''} vence${dueTodayCount > 1 ? 'n' : ''} hoy (${fmt(dueTodayAmount)})`);
          const body = `Préstamos: ${parts.join(' · ')}.`;
          await this.notifications
            .createForRoles(company.id, ['SUPER_ADMIN', 'ADMIN'], { type: 'loans-overdue', title: 'Cartera de préstamos', body, url: '/dashboard/prestamos' })
            .catch(() => null);
          await this.push
            .sendToCompanyRoles(company.id, ['SUPER_ADMIN', 'ADMIN'], { title: 'Cartera de préstamos', body, url: '/dashboard/prestamos', tag: 'loans-overdue' })
            .catch(() => null);
        }
        for (const [collectorId, g] of byCollector) {
          if (!g.overdue && !g.today) continue;
          const parts: string[] = [];
          if (g.today) parts.push(`${g.today} por cobrar hoy (${fmt(g.todayAmt)})`);
          if (g.overdue) parts.push(`${g.overdue} en mora (${fmt(g.overdueAmt)})`);
          const body = `Tu ruta: ${parts.join(' · ')}.`;
          await this.notifications
            .create(company.id, collectorId, { type: 'loans-route', title: 'Ruta de cobro de hoy', body, url: '/dashboard/prestamos/ruta' })
            .catch(() => null);
          await this.push
            .sendToUsers([collectorId], { title: 'Ruta de cobro de hoy', body, url: '/dashboard/prestamos/ruta', tag: 'loans-route' })
            .catch(() => null);
        }
      }
    } catch {
      /* silencioso */
    }
  }

  // Botón "Recordar ahora": correo inmediato al cliente de un préstamo.
  async sendNow(user: any, loanId: number) {
    await this.loans.assertLoansEnabled(user.companyId);
    const loan: any = await this.prisma.loan.findFirst({
      where: { id: loanId, companyId: user.companyId },
      include: { customer: { select: { id: true, name: true, email: true } }, installments: true },
    });
    if (!loan) throw new BadRequestException('Préstamo no encontrado.');
    if (user.role === 'COBRADOR' && loan.collectorId !== user.id) throw new BadRequestException('Este préstamo no está asignado a ti.');
    if (loan.status !== 'DESEMBOLSADO') throw new BadRequestException('El préstamo no está vigente.');
    const email = loan.customer?.email?.trim();
    if (!email) throw new BadRequestException('El cliente no tiene correo registrado.');
    const s = this.summaryOf(loan, todayCo());
    if (s.pendingTotal <= 0) throw new BadRequestException('El préstamo no tiene saldo pendiente.');
    const company: any = await this.prisma.company.findUnique({ where: { id: user.companyId }, omit: { mailPassword: false } });
    const r = await this.deliverEmail({ ...loan, customer: { ...loan.customer, email } }, company, s);
    await this.prisma.loan.update({ where: { id: loan.id }, data: { reminderSentAt: new Date() } });
    return { success: true, data: { sent: true, via: r?.via || 'email', to: email } };
  }
}
