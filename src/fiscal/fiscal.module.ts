import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { PlanLimitsService } from '@/common/plan-limits.service';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { FiscalConsumersController } from './fiscal-consumers.controller';
import { FiscalConsumersService } from './fiscal-consumers.service';

@Module({
  controllers: [FiscalController, FiscalConsumersController],
  providers: [
    FiscalService,
    FiscalConsumersService,
    MailService,
    PlanLimitsService,
  ],
  exports: [FiscalService],
})
export class FiscalModule {}
