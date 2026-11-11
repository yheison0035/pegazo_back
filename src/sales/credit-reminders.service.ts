import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';
import { summarizeCredit } from './credit-plan.util';
import { assertLocalAccess } from '@/common/access-locals.util';

const DAY = 86400000;
// No volver a recordar la misma venta en menos de estos días (evita spam diario;
// a la vez permite insistir ~semanalmente mientras siga vencida/sin pagar).
const THROTTLE_DAYS = 6;

type SaleForReminder = {
  id: number;
  code: string;
  totalAmount: number;
  dueDate: Date | null;
  creditInterestAmount: any;
  creditDownPayment: any;
  creditReminderSentAt: Date | null;
  payments: { amount: any }[];
  installments: { number: number; dueDate: Date; amount: any }[];
  customer: { id: number; name: string; email: string | null } | null;
};

// Lo que hay que recordarle al cliente de una venta a crédito, o null si no hay
// nada por cobrar / no hay fecha de referencia.
type ReminderRef = {
  dueDate: Date;
  overdue: boolean;
  overdueDays: number;
  amount: number; // monto de la cuota pendiente (o del saldo en fiado simple)
  saldo: number; // saldo total del crédito
  installmentLabel: string | null;
};

@Injectable()
export class CreditRemindersService {
  private readonly logger = new Logger(CreditRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Calcula qué recordarle al cliente de una venta a crédito. Devuelve null si
  // la venta ya está saldada o no tiene fecha de vencimiento a la cual anclar.
  private computeRef(sale: SaleForReminder, now: Date): ReminderRef | null {
    const interest = Number(sale.creditInterestAmount) || 0;
    const total = (Number(sale.totalAmount) || 0) + interest;
    const paid = sale.payments.reduce((a, p) => a + Number(p.amount), 0);
    const hasPlan = (sale.installments?.length || 0) > 0;

    if (hasPlan) {
      const sum = summarizeCredit({
        obligation: total,
        downPayment: Number(sale.creditDownPayment) || 0,
        totalPaid: paid,
        installments: sale.installments.map((i) => ({
          number: i.number,
          dueDate: i.dueDate,
          amount: Number(i.amount),
        })),
        now,
      });
      if (sum.saldo <= 0.01 || !sum.nextDueDate) return null;
      const next = sum.installments.find((i) => i.pending > 0.01);
      if (!next) return null;
      return {
        dueDate: new Date(sum.nextDueDate),
        overdue: sum.overdueDays > 0,
        overdueDays: sum.overdueDays,
        amount: Math.round(next.pending),
        saldo: Math.round(sum.saldo),
        installmentLabel: `Cuota ${next.number} de ${sum.installments.length}`,
      };
    }

    // Fiado simple (sin cronograma de cuotas): todo el saldo vence en dueDate.
    const saldo = Math.round(total - paid);
    if (saldo <= 0.01) return null;
    if (!sale.dueDate) return null;
    const due = new Date(sale.dueDate);
    const overdueDays = Math.max(
      0,
      Math.floor((now.getTime() - due.getTime()) / DAY),
    );
    return {
      dueDate: due,
      overdue: overdueDays > 0,
      overdueDays,
      amount: saldo,
      saldo,
      installmentLabel: null,
    };
  }

  private buildSmtp(company: any) {
    return company.mailHost
      ? {
          host: company.mailHost,
          port: company.mailPort,
          user: company.mailUser,
          pass: company.mailPassword,
          fromEmail: company.mailFromEmail,
          fromName: company.mailFromName || company.name,
        }
      : undefined;
  }

  private async deliver(sale: SaleForReminder, company: any, ref: ReminderRef) {
    return this.mail.sendCreditReminder({
      to: sale.customer!.email!,
      companyName: company.mailFromName || company.name || 'Tu negocio',
      smtp: this.buildSmtp(company),
      brandColor: company.primaryColor,
      logo: company.logo || null,
      customerName: sale.customer?.name || null,
      saleCode: sale.code,
      installmentLabel: ref.installmentLabel,
      dueDate: ref.dueDate,
      overdue: ref.overdue,
      overdueDays: ref.overdueDays,
      amount: ref.amount,
      saldo: ref.saldo,
      supportEmail: company.email || company.mailFromEmail || null,
      supportPhone: company.phone || null,
    });
  }

  private saleInclude() {
    return {
      customer: { select: { id: true, name: true, email: true } },
      payments: { select: { amount: true } },
      installments: {
        orderBy: { number: 'asc' as const },
        select: { number: true, dueDate: true, amount: true },
      },
    };
  }

  // ───────── Cron diario: 8:00 a.m. Colombia (13:00 UTC) ─────────
  // Por cada empresa con los recordatorios activados, avisa al cliente de las
  // cuotas próximas a vencer (sus días de antelación) y de las vencidas. Nunca
  // lanza: un correo que falle no puede tumbar el cron.
  @Cron('0 13 * * *')
  async runDaily() {
    try {
      const companies: any[] = await this.prisma.company.findMany({
        where: { creditRemindersEnabled: true },
        omit: { mailPassword: false },
      });
      if (!companies.length) return;

      const now = new Date();
      for (const company of companies) {
        const daysBefore = Math.max(
          0,
          Math.min(60, Number(company.creditReminderDaysBefore) || 1),
        );
        const windowMs = daysBefore * DAY;

        let sales: SaleForReminder[] = [];
        try {
          sales = (await this.prisma.sale.findMany({
            where: {
              paymentStatus: 'FIADO',
              local: { is: { companyId: company.id } },
              customer: { is: { email: { not: null } } },
            },
            include: this.saleInclude(),
          })) as any;
        } catch {
          continue;
        }

        for (const sale of sales) {
          const email = sale.customer?.email?.trim();
          if (!email) continue;

          const ref = this.computeRef(sale, now);
          if (!ref) continue;

          // Solo dentro de la ventana (o ya vencida).
          if (ref.dueDate.getTime() - now.getTime() > windowMs) continue;

          // Antispam: no repetir antes de THROTTLE_DAYS.
          if (
            sale.creditReminderSentAt &&
            now.getTime() - new Date(sale.creditReminderSentAt).getTime() <
              THROTTLE_DAYS * DAY
          ) {
            continue;
          }

          try {
            await this.deliver(sale, company, ref);
            await this.prisma.sale.update({
              where: { id: sale.id },
              data: { creditReminderSentAt: now },
            });
          } catch (e) {
            this.logger.warn(
              `Recordatorio de crédito falló (venta ${sale.code}): ${e}`,
            );
          }
        }
      }
    } catch {
      // Silencioso: el cron nunca debe tumbar la app.
    }
  }

  // ───────── Botón "Recordar ahora" (manual) ─────────
  // Envía el correo al instante, aunque la empresa tenga apagados los avisos
  // automáticos: el dueño lo está pidiendo explícitamente. Requiere que el
  // cliente tenga correo y que el crédito siga con saldo.
  async sendNow(saleId: number, user: any) {
    const sale: any = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { ...this.saleInclude(), local: { select: { companyId: true } } },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada.');

    // Aislamiento: la venta debe ser de un local al que el usuario tenga acceso
    // (y, para roles globales, de su propia empresa). assertLocalAccess cubre ambos.
    await assertLocalAccess(this.prisma, user, sale.localId);

    const email = sale.customer?.email?.trim();
    if (!email) {
      throw new BadRequestException(
        'El cliente no tiene un correo registrado. Agrégaselo en su ficha para poder enviarle el recordatorio.',
      );
    }

    const now = new Date();
    const ref = this.computeRef(sale, now);
    if (!ref) {
      throw new BadRequestException(
        'Este crédito ya no tiene saldo pendiente por cobrar.',
      );
    }

    const company: any = await this.prisma.company.findUnique({
      where: { id: sale.local.companyId },
      omit: { mailPassword: false },
    });

    try {
      const res = await this.deliver(sale, company, ref);
      await this.prisma.sale.update({
        where: { id: sale.id },
        data: { creditReminderSentAt: now },
      });
      return {
        success: true,
        message: `Recordatorio enviado a ${email}.`,
        via: res.via,
      };
    } catch (e: any) {
      throw new BadRequestException(
        e?.message ||
          'No se pudo enviar el correo. Revisa la configuración de correo del negocio.',
      );
    }
  }
}
