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

    // Pago de una VENTA de la tienda. La REFERENCIA de Wompi es el código del
    // pedido, así que se busca por `code` (o `wompiReference` por compatibilidad).
    const sale = await this.findSaleByReference(reference);
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
      await this.finalizeApprovedSale(sale.id, sale.local.companyId, tx?.id);
    } else {
      await this.cancelPendingSale(sale.id, status);
    }

    return { received: true, valid: true };
  }

  // Diagnóstico de SOLO LECTURA: ¿hay envío de correo central disponible? No
  // envía correos ni expone secretos.
  @Public()
  @Get('diag/mail')
  mailDiag() {
    return this.mail.transportStatus();
  }

  // CONFIRMACIÓN AL VOLVER DEL PAGO (respaldo del webhook). La tienda llama a
  // este endpoint con el id de la transacción de Wompi; se consulta el estado
  // REAL en Wompi y, si está aprobado, se finaliza el pedido (descontar stock,
  // marcar PAGADA, correo) de forma idempotente. Así el pedido aparece aunque el
  // webhook no llegue o el secreto de eventos esté mal.
  @Public()
  @Get('confirm/:transactionId')
  async confirm(@Param('transactionId') transactionId: string) {
    let status: string | undefined;
    let reference: string | undefined;
    try {
      // Consulta en el ambiente correcto (pruebas o producción) según exista.
      const res: any =
        await this.wompiService.getTransactionAnyEnv(transactionId);
      status = res?.data?.status;
      reference = res?.data?.reference;
    } catch {
      return { status: 'PENDING' };
    }
    if (!reference || !status) return { status: 'PENDING' };

    const sale = await this.findSaleByReference(reference);
    if (!sale) return { status };

    if (status === 'APPROVED') {
      await this.finalizeApprovedSale(
        sale.id,
        sale.local.companyId,
        transactionId,
      );
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
      await this.cancelPendingSale(sale.id, status);
    }
    return { status };
  }

  // Busca la venta de la tienda por la referencia de Wompi (= código del pedido).
  private async findSaleByReference(reference: string) {
    return this.prisma.sale.findFirst({
      where: {
        source: 'ECOMMERCE' as any,
        OR: [{ code: reference }, { wompiReference: reference }],
      },
      select: {
        id: true,
        paymentStatus: true,
        local: { select: { companyId: true } },
      },
    });
  }

  // Finaliza un pedido pagado: descuenta stock (atómico), lo marca PAGADA/NUEVA y
  // envía el correo de confirmación. Idempotente (no hace nada si ya está PAGADA).
  private async finalizeApprovedSale(
    saleId: number,
    companyId: number,
    txId?: string,
  ) {
    const processed = await this.prisma.$transaction(async (db) => {
      const fresh = await db.sale.findUnique({
        where: { id: saleId },
        select: { paymentStatus: true },
      });
      if (fresh?.paymentStatus === 'PAGADA') return false;

      const items = await db.saleItem.findMany({
        where: { saleId },
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
        if (dec.count === 0) {
          sinStock.push(it.variant?.inventory?.name || 'producto');
        }
      }

      await db.sale.update({
        where: { id: saleId },
        data: {
          wompiStatus: 'APPROVED',
          wompiTransactionId: txId ?? undefined,
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

    if (processed) {
      this.sendPaymentConfirmation(saleId, companyId).catch(() => undefined);
    }
    return processed;
  }

  // Cancela un pedido con pago fallido (solo si seguía EN_VALIDACION; no toca uno
  // ya pagado). No se había descontado stock.
  private async cancelPendingSale(saleId: number, status: string) {
    await this.prisma.sale.updateMany({
      where: { id: saleId, paymentStatus: 'EN_VALIDACION' as any },
      data: {
        wompiStatus: status,
        saleStatus: 'CANCELADA' as any,
        paymentStatus: 'RECHAZADA' as any,
      },
    });
  }

  // Envía al cliente el correo de CONFIRMACIÓN de compra con TODOS los datos.
  private async sendPaymentConfirmation(saleId: number, companyId: number) {
    const sale: any = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        code: true,
        subtotal: true,
        totalAmount: true,
        notes: true,
        ecommerceCustomer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            address: true,
            neighborhood: true,
            city: true,
            department: true,
          },
        },
        items: {
          select: {
            quantity: true,
            price: true,
            variant: { select: { inventory: { select: { name: true } } } },
          },
        },
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

    const subtotal = sale.subtotal != null ? Number(sale.subtotal) : null;
    const total = Number(sale.totalAmount) || 0;
    const shippingCost = subtotal != null ? Math.max(total - subtotal, 0) : null;
    const ec = sale.ecommerceCustomer;
    const address = [ec?.address, ec?.neighborhood, ec?.city, ec?.department]
      .filter(Boolean)
      .join(', ');
    const deliveryMatch = /Entrega:\s*([^·]+)/.exec(sale.notes || '');

    await this.mail.sendOrderConfirmation({
      to,
      companyName: company.mailFromName || company.name || 'Tienda',
      smtp,
      brandColor: company.primaryColor,
      logo: company.logo || null,
      trackUrl: company.domain ? `https://${company.domain}` : null,
      // Reply-to = correo del negocio (las respuestas del cliente le llegan a él).
      replyTo: company.email || company.mailFromEmail || null,
      supportEmail: company.email || company.mailFromEmail || null,
      supportPhone: company.phone || null,
      order: {
        code: sale.code,
        items: (sale.items || []).map((it: any) => ({
          name: it.variant?.inventory?.name || 'Producto',
          quantity: it.quantity,
          price: Number(it.price) || 0,
        })),
        subtotal,
        shippingCost,
        total,
        address: address || null,
        customerName: `${ec?.firstName || ''} ${ec?.lastName || ''}`.trim(),
        paymentLabel: 'Pago en línea',
        deliveryLabel: deliveryMatch ? deliveryMatch[1].trim() : null,
      },
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
