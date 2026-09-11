import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { TaxService } from './tax.service';
import { TaxAlertsService } from './tax-alerts.service';

@Controller('tax')
@UseGuards(JwtAuthGuard)
export class TaxController {
  constructor(
    private readonly service: TaxService,
    private readonly alerts: TaxAlertsService,
  ) {}

  // ----- Empresa: su calendario (dueño, admin, contador) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Get('calendar')
  calendar(@Req() req, @Query() query) {
    return this.service.companyCalendar(req.user, query);
  }

  // ----- Empresa: perfil fiscal (responsabilidades del RUT) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Get('profile')
  getProfile(@Req() req) {
    return this.service.getProfile(req.user);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Patch('profile')
  updateProfile(@Req() req, @Body() dto) {
    return this.service.updateProfile(req.user, dto);
  }

  // ----- Empresa: magnitudes anuales (topes de renta) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Get('tax-year')
  getTaxYear(@Req() req, @Query('year') year?: string) {
    return this.service.getTaxYear(req.user, year);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Patch('tax-year')
  updateTaxYear(@Req() req, @Body() dto) {
    return this.service.updateTaxYear(req.user, dto);
  }

  // ----- Empresa: obligaciones DIAN derivadas (¿debe declarar renta?) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Get('obligations')
  obligations(@Req() req, @Query() query) {
    return this.service.obligations(req.user, query);
  }

  // Revisa ahora los vencimientos y crea avisos en la campana (además del cron
  // diario). Útil como botón "revisar ahora".
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Post('run-alerts')
  runAlerts(@Req() req) {
    return this.alerts.runForCompany(req.user.companyId);
  }

  // Envía un correo de MUESTRA del aviso a una dirección (previsualizar/probar).
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Post('test-alert-email')
  testAlertEmail(@Req() req, @Body('to') to: string) {
    return this.alerts.sendSampleEmail(to);
  }

  // ----- Plataforma: administrar calendario y parámetros -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('deadlines')
  listDeadlines(@Query('year') year?: string) {
    return this.service.listDeadlines(year ? Number(year) : undefined);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Post('deadlines')
  createDeadline(@Body() dto) {
    return this.service.createDeadline(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Patch('deadlines/:id')
  updateDeadline(@Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.service.updateDeadline(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Delete('deadlines/:id')
  removeDeadline(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDeadline(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('parameters')
  listParameters(@Query('year') year?: string) {
    return this.service.listParameters(year ? Number(year) : undefined);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Post('parameters')
  upsertParameter(@Body() dto) {
    return this.service.upsertParameter(dto);
  }
}
