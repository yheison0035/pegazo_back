import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { AccountingService } from './accounting.service';
import { ManualEntriesService } from './manual-entries.service';

// Libros contables derivados (Contabilidad). Solo dueño y admin.
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
export class AccountingController {
  constructor(
    private readonly service: AccountingService,
    private readonly manualEntries: ManualEntriesService,
  ) {}

  // Asientos manuales de la propia empresa (dueño/admin/contador interno).
  @Get('entries')
  listEntries(@Req() req, @Query() q) {
    return this.manualEntries.list(req.user.companyId, q);
  }

  @Post('entries')
  createEntry(@Req() req, @Body() dto) {
    return this.manualEntries.create(req.user.companyId, dto);
  }

  @Delete('entries/:id')
  removeEntry(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.manualEntries.remove(req.user.companyId, id);
  }

  @Post('entries/import')
  importEntries(@Req() req, @Body('rows') rows: any[]) {
    return this.manualEntries.bulkImport(req.user.companyId, rows);
  }

  @Get('journal')
  journal(@Req() req, @Query() query) {
    return this.service.journal(req.user, query);
  }

  @Get('ledger')
  ledger(@Req() req, @Query() query) {
    return this.service.ledger(req.user, query);
  }

  @Get('financials')
  financials(@Req() req, @Query() query) {
    return this.service.financials(req.user, query);
  }
}
