import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { LedgerAccountsService } from './ledger-accounts.service';

// Plan de cuentas (Contabilidad). Información financiera: solo dueño y admin.
@Controller('ledger-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
export class LedgerAccountsController {
  constructor(private readonly service: LedgerAccountsService) {}

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user);
  }

  @Post()
  create(@Req() req, @Body() dto) {
    return this.service.create(req.user, dto);
  }

  // Importar plan de cuentas desde Excel/CSV (filas: codigo, nombre, grupo,
  // naturaleza). Crea las nuevas y actualiza el nombre de las existentes.
  @Post('import')
  bulkImport(@Req() req, @Body('rows') rows: any[]) {
    return this.service.bulkImport(req.user, rows);
  }

  @Patch(':id')
  update(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.service.update(req.user, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user, id);
  }
}
