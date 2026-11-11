import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from '@/prisma.service';
import { InventoryModule } from '@/inventory/inventory.module';
import { PlanLimitsModule } from '@/common/plan-limits.module';
import { RecipesModule } from '@/recipes/recipes.module';
import { MailService } from '@/mail/mail.service';
import { CreditRemindersService } from './credit-reminders.service';

@Module({
  imports: [InventoryModule, PlanLimitsModule, RecipesModule],
  controllers: [SalesController],
  providers: [SalesService, PrismaService, MailService, CreditRemindersService],
  exports: [SalesService],
})
export class SalesModule {}
