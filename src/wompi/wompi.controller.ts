import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { WompiService } from './wompi.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';
import { WebsiteGuard } from '@/common/guards/website.guard';
import { Website } from '@/common/decorators/website.decorator';
import { WebsiteContext } from '@/modules/website/interfaces/website-context.interface';

@Controller('wompi')
export class WompiController {
  constructor(
    private readonly wompiService: WompiService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Firma de integridad para el checkout de la TIENDA. Usa el secreto de la
  // empresa dueña del dominio (WebsiteGuard resuelve la empresa por el host).
  @Public()
  @UseGuards(WebsiteGuard)
  @Post('signature')
  async createSignature(
    @Body() dto: CreateSignatureDto,
    @Website() website: WebsiteContext,
  ) {
    const company: any = await this.prisma.company.findUnique({
      where: { id: website.companyId },
      omit: { wompiIntegritySecret: false },
    });
    if (!company?.wompiEnabled || !company?.wompiIntegritySecret) {
      throw new BadRequestException(
        'Esta tienda no tiene pagos en línea configurados.',
      );
    }
    const { signature } = this.wompiService.generateSignature({
      ...dto,
      integritySecret: company.wompiIntegritySecret,
    });
    // Devolvemos también la llave pública desde el SERVIDOR: así el checkout de
    // la tienda no depende de datos cacheados en el navegador (evita redirigir a
    // Wompi con una llave vieja/vacía si el config cambió sin recargar).
    return { signature, publicKey: company.wompiPublicKey };
  }

  @Public()
  @Get('transaction/:id')
  async getTransaction(@Param('id') id: string) {
    return this.wompiService.getTransaction(id);
  }

  // Webhook de confirmación de pago que Wompi llama directamente. La firma se
  // verifica con el secreto de eventos que corresponda: el de la empresa (venta
  // de tienda) o el global de Pegazo (suscripción SUB-*).
  @Public()
  @Post('webhook')
  async webhook(@Body() event: any) {
    const tx = event?.data?.transaction;
    const reference = tx?.reference;
    const status = tx?.status; // APPROVED | DECLINED | VOIDED | ERROR

    if (!reference || !status) {
      return { received: true, valid: false };
    }

    // Pago de SUSCRIPCIÓN de Pegazo: secreto de eventos global.
    if (reference.startsWith('SUB-')) {
      if (!this.wompiService.verifyEventChecksum(event)) {
        return { received: true, valid: false };
      }
      await this.applySubscription(reference, status, tx?.id);
      return { received: true, valid: true };
    }

    // Pago de una VENTA de la tienda: ubicar la empresa por la venta y verificar
    // con SU secreto de eventos.
    const sale = await this.prisma.sale.findFirst({
      where: { wompiReference: reference },
      select: {
        id: true,
        paymentStatus: true,
        local: { select: { companyId: true } },
      },
    });
    if (!sale) {
      return { received: true, valid: false };
    }
    const company: any = await this.prisma.company.findUnique({
      where: { id: sale.local.companyId },
      omit: { wompiEventsSecret: false },
    });
    if (
      !this.wompiService.verifyEventChecksum(
        event,
        company?.wompiEventsSecret || undefined,
      )
    ) {
      return { received: true, valid: false };
    }

    if (status === 'APPROVED') {
      // Pago confirmado: recién AHORA se descuenta el stock (de forma atómica) y
      // el pedido se revela en el CRM (NUEVA/PAGADA). Idempotente: si ya estaba
      // PAGADA, no se vuelve a descontar. Devuelve true SOLO la primera vez, para
      // enviar el correo de confirmación una única vez.
      const processed = await this.prisma.$transaction(async (db) => {
        const fresh = await db.sale.findUnique({
          where: { id: sale.id },
          select: { paymentStatus: true },
        });
        if (fresh?.paymentStatus === 'PAGADA') return false; // ya procesado

        const items = await db.saleItem.findMany({
          where: { saleId: sale.id },
          select: {
            inventoryVariantId: true,
            quantity: true,
            variant: {
              select: { inventory: { select: { trackStock: true, name: true } } },
            },
          },
        });

        const sinStock: string[] = [];
        for (const it of items) {
          if (!it.inventoryVariantId) continue;
          if (it.variant?.inventory?.trackStock === false) continue;
          const dec = await db.inventoryVariant.updateMany({
            where: { id: it.inventoryVariantId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity } },
          });
          // Si se agotó tras el pago, el dinero ya entró: se marca para gestión
          // manual (no se aborta, no se pierde el pago).
          if (dec.count === 0) {
            sinStock.push(it.variant?.inventory?.name || 'producto');
          }
        }

        await db.sale.update({
          where: { id: sale.id },
          data: {
            wompiStatus: status,
            wompiTransactionId: tx?.id ?? undefined,
            paymentStatus: 'PAGADA' as any,
            saleStatus: 'NUEVA' as any,
            ...(sinStock.length && {
              notes: `⚠ Pago aprobado pero SIN STOCK de: ${sinStock.join(
                ', ',
              )}. Revisar manualmente.`,
            }),
          },
        });
        return true;
      });

      // Correo de CONFIRMACIÓN de pago al cliente (una sola vez). No bloquea ni
      // rompe el webhook si el correo falla.
      if (processed) {
        this.sendPaymentConfirmation(sale.id, sale.local.companyId).catch(
          () => undefined,
        );
      }
    } else {
      // DECLINED / VOIDED / ERROR: cancelar el pedido pendiente (no se tocó
      // stock). Solo si aún estaba en validación, para no pisar un pago aprobado.
      await this.prisma.sale.updateMany({
        where: { id: sale.id, paymentStatus: 'EN_VALIDACION' as any },
        data: {
          wompiStatus: status,
          saleStatus: 'CANCELADA' as any,
          paymentStatus: 'RECHAZADA' as any,
        },
      });
    }

    return { received: true, valid: true };
  }

  // Envía al cliente el correo de CONFIRMACIÓN de pago (marca de la empresa).
  private async sendPaymentConfirmation(saleId: number, companyId: number) {
    const sale: any = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        code: true,
        totalAmount: true,
        ecommerceCustomer: { select: { email: true } },
      },
    });
    const to = sale?.ecommerceCustomer?.email;
    if (!to) return;

    const company: any = await this.prisma.company.findUnique({
      where: { id: companyId },
      omit: { mailPassword: false },
    });
    if (!company) return;

    const smtp = company.mailHost
      ? {
          host: company.mailHost,
          port: company.mailPort,
          user: company.mailUser,
          pass: company.mailPassword,
          fromEmail: company.mailFromEmail,
          fromName: company.mailFromName || company.name,
        }
      : undefined;

    await this.mail.sendOrderStatusUpdate({
      to,
      companyName: company.mailFromName || company.name || 'Tienda',
      smtp,
      orderCode: sale.code,
      statusLabel: '¡Pago confirmado!',
      message:
        'Recibimos tu pago correctamente y ya estamos preparando tu pedido. Te avisaremos cuando sea despachado.',
      brandColor: company.primaryColor,
      trackUrl: company.domain ? `https://${company.domain}` : null,
    });
  }

  // Confirma un pago de suscripción y activa el plan de la empresa. Idempotente:
  // si ya estaba APPROVED, no vuelve a sumar días.
  private async applySubscription(
    reference: string,
    status: string,
    transactionId?: string,
  ) {
    const pay = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
    });
    if (!pay || pay.status === 'APPROVED') return;

    await this.prisma.subscriptionPayment.update({
      where: { reference },
      data: { status, transactionId: transactionId ?? pay.transactionId },
    });

    if (status !== 'APPROVED') return;

    const company = await this.prisma.company.findUnique({
      where: { id: pay.companyId },
      select: { paidUntil: true },
    });
    const now = new Date();
    const from =
      company?.paidUntil && new Date(company.paidUntil) > now
        ? new Date(company.paidUntil)
        : now;
    const paidUntil = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.company.update({
      where: { id: pay.companyId },
      data: { plan: pay.plan, monthlyPrice: pay.amount, paidUntil },
    });
  }
}
