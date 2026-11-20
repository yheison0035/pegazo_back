import { Module } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { PlanLimitsModule } from '@/common/plan-limits.module';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';

// Préstamos (tipo de negocio FINANCIERA). Módulo independiente del fiado de
// ventas: no toca Sales ni Cartera. AuditService es global.
@Module({
  imports: [PlanLimitsModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService],
  exports: [LoansService],
})
export class LoansModule {}
