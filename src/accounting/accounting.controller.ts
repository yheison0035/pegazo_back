import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { AccountingService } from './accounting.service';

// Libros contables derivados (Contabilidad). Solo dueño y admin.
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('journal')
  journal(@Req() req, @Query() query) {
    return this.service.journal(req.user, query);
  }

  @Get('ledger')
  ledger(@Req() req, @Query() query) {
    return this.service.ledger(req.user, query);
  }
}
