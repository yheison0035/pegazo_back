import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { MailService } from '@/mail/mail.service';
import { TaxService } from './tax.service';

// Avisos de vencimientos tributarios (E2). Vive SOLO en TaxModule (no en
// AccountantModule) para que el @Cron se registre una única vez, aunque
// TaxService se instancie en varios módulos.
//
// Cada día crea en la campana (in-app) un aviso por cada obligación que entra
// en la ventana de "próxima" (≤ 8 días) o que está "recién vencida" (hasta 15
// días atrás), a dueño/admin/contador. Idempotente: no repite el mismo aviso
// (empresa + obligación + fase) dentro de los últimos 60 días.

const SOON_DAYS = 8;
const OVERDUE_GRACE_DAYS = 15;
const DEDUP_WINDOW_MS = 60 * 86400000;

function daysLabel(n: number): string {
  if (n < 0) return `venció hace ${Math.abs(n)} día${Math.abs(n) !== 1 ? 's' : ''}`;
  if (n === 0) return 'vence hoy';
  if (n === 1) return 'vence mañana';
  return `faltan ${n} días`;
}

@Injectable()
export class TaxAlertsService {
  private readonly logger = new Logger(TaxAlertsService.name);

  constructor(
    private prisma: PrismaService,
    private tax: TaxService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}

  // 8:00 a. m. Colombia (13:00 UTC), todos los días.
  @Cron('0 13 * * *')
  async notifyTaxDeadlines() {
    try {
      const companies = await this.prisma.company.findMany({
        where: { accountingEnabled: true },
        select: { id: true },
      });
      for (const c of companies) {
        await this.notifyOne(c.id).catch(() => null);
      }
    } catch (e) {
      // Silencioso: el cron nunca debe tumbar la app.
      this.logger.warn(`notifyTaxDeadlines falló: ${e}`);
    }
  }

  // Envía un correo de MUESTRA (datos de ejemplo) a una dirección, para
  // previsualizar/probar el aviso sin tocar dedupe ni fechas reales.
  async sendSampleEmail(to: string, companyName = 'Empresa de prueba') {
    const items = [
      { title: 'Declaración de IVA', period: 'Bimestre 5', daysLeft: 5, phase: 'PROXIMO' },
      { title: 'Retención en la fuente', period: 'Agosto', daysLeft: -3, phase: 'VENCIDO' },
    ];
    const res = await this.mail.sendTaxDeadlineAlert({ to, companyName, items });
    return { success: true, data: res };
  }

  // Disparo manual para una empresa (botón "revisar ahora"). Devuelve cuántos
  // avisos nuevos creó.
  async runForCompany(companyId: number) {
    const created = await this.notifyOne(companyId).catch(() => 0);
    return { success: true, data: { created } };
  }

  private async notifyOne(companyId: number): Promise<number> {
    let created = 0;
    const cal = await this.tax.buildCalendar(companyId, {});
    const relevant = (cal.deadlines || []).filter(
      (d: any) =>
        (d.status === 'PROXIMO' && d.daysLeft <= SOON_DAYS) ||
        (d.status === 'VENCIDO' && d.daysLeft >= -OVERDUE_GRACE_DAYS),
    );
    if (!relevant.length) return created;

    // Dedup: qué avisos (obligación + fase) ya se crearon hace poco.
    const existing = await this.prisma.notification.findMany({
      where: {
        companyId,
        type: 'TAX_DEADLINE',
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
      select: { data: true },
    });
    const seen = new Set(
      existing.map((n) => {
        const d: any = n.data || {};
        return `${d.deadlineId}:${d.phase}`;
      }),
    );

    const newItems: {
      title: string;
      period?: string | null;
      daysLeft: number;
      phase: string;
    }[] = [];

    for (const d of relevant) {
      const phase = d.status; // PROXIMO | VENCIDO
      const key = `${d.id}:${phase}`;
      if (seen.has(key)) continue;
      await this.notifications
        .createForRoles(companyId, ['SUPER_ADMIN', 'ADMIN', 'CONTADOR'], {
          type: 'TAX_DEADLINE',
          title:
            phase === 'VENCIDO'
              ? 'Obligación tributaria vencida'
              : 'Vence una obligación tributaria',
          body: `${d.title}${d.period ? ` (${d.period})` : ''} — ${daysLabel(d.daysLeft)}.`,
          url: '/dashboard/calendario-tributario',
          data: {
            deadlineId: d.id,
            phase,
            obligation: d.obligation,
            dueDate: d.dueDate,
          },
        })
        .catch(() => null);
      seen.add(key);
      created += 1;
      newItems.push({ title: d.title, period: d.period, daysLeft: d.daysLeft, phase });
    }

    // Correo (E2b): un solo mensaje con los avisos NUEVOS, a dueño/admins y
    // contadores enlazados. Respeta el dedupe (solo si hubo avisos nuevos).
    if (newItems.length) await this.emailAlerts(companyId, newItems);

    return created;
  }

  private async emailAlerts(
    companyId: number,
    items: { title: string; period?: string | null; daysLeft: number; phase: string }[],
  ) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, businessName: true },
      });
      const companyName = company?.businessName || company?.name || 'Tu empresa';

      const [users, links] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            companyId,
            role: { in: ['SUPER_ADMIN', 'ADMIN'] as any },
            status: { not: 'ELIMINADO' as any },
          },
          select: { email: true },
        }),
        this.prisma.accountantCompany.findMany({
          where: { companyId, status: 'ACTIVE' },
          select: { accountant: { select: { email: true } } },
        }),
      ]);
      const emails = new Set<string>();
      for (const u of users) if (u.email) emails.add(u.email.toLowerCase());
      for (const l of links)
        if (l.accountant?.email) emails.add(l.accountant.email.toLowerCase());

      for (const to of emails) {
        await this.mail
          .sendTaxDeadlineAlert({ to, companyName, items })
          .catch(() => null);
      }
    } catch {
      /* silencioso */
    }
  }
}
