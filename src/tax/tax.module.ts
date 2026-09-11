import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxAlertsService } from './tax-alerts.service';
import { TaxController } from './tax.controller';
import { PrismaService } from '@/prisma.service';
import { FiscalModule } from '@/fiscal/fiscal.module';

@Module({
  imports: [FiscalModule], // motor de reglas tributarias (API fiscal)
  controllers: [TaxController],
  // TaxAlertsService (cron de avisos) vive SOLO aquí para registrar el @Cron una
  // sola vez. NotificationsService es global (no requiere import).
  providers: [TaxService, TaxAlertsService, PrismaService],
})
export class TaxModule {}
