import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxAlertsService } from './tax-alerts.service';
import { TaxController } from './tax.controller';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';
import { FiscalModule } from '@/fiscal/fiscal.module';

@Module({
  imports: [FiscalModule], // motor de reglas tributarias (API fiscal)
  controllers: [TaxController],
  // TaxAlertsService (cron de avisos) vive SOLO aquí para registrar el @Cron una
  // sola vez. NotificationsService es global (no requiere import). MailService
  // no tiene dependencias (usa env), se provee aquí para el correo de aviso.
  providers: [TaxService, TaxAlertsService, PrismaService, MailService],
})
export class TaxModule {}
