import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';

// Configuración self-service de la propia empresa (para el dueño/admin), aparte
// del controlador de plataforma que solo usa el SUPER_PLATFORM_ADMIN.
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanySettingsController {
  constructor(private readonly service: CompaniesService) {}

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('settings')
  getSettings(@Req() req) {
    return this.service.getOwnSettings(req.user);
  }

  // Sin @Roles: cualquier usuario autenticado (incluida la caja/cajero) puede
  // leer la config fiscal mínima que el POS necesita para calcular el IVA.
  @Get('fiscal-config')
  getFiscalConfig(@Req() req) {
    return this.service.getFiscalConfig(req.user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('loyalty')
  updateLoyalty(
    @Body()
    dto: {
      loyaltyEnabled?: boolean;
      loyaltyStampsRequired?: number;
      loyaltyReward?: string;
    },
    @Req() req,
  ) {
    return this.service.updateLoyalty(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('loyalty/sync')
  syncLoyalty(@Req() req) {
    return this.service.syncLoyaltyFromSales(req.user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('theme')
  updateTheme(@Body('theme') theme: string, @Req() req) {
    return this.service.updateCrmTheme(req.user, theme);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('font')
  updateFont(@Body('font') font: string, @Req() req) {
    return this.service.updateCrmFont(req.user, font);
  }

  // Correo propio del negocio (SMTP) para enviar sus correos.
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('mail')
  updateMail(@Body() dto: any, @Req() req) {
    return this.service.updateMailConfig(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('mail/test')
  testMail(@Body('to') to: string, @Req() req) {
    return this.service.sendMailTest(req.user, to);
  }

  // Pasarela de pagos propia de la tienda (Wompi por empresa).
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('wompi')
  getWompi(@Req() req) {
    return this.service.getWompiConfig(req.user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('wompi')
  updateWompi(@Body() dto: any, @Req() req) {
    return this.service.updateWompiConfig(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('cash-policy')
  updateCashPolicy(@Body('requireCashOpen') requireCashOpen: boolean, @Req() req) {
    return this.service.updateCashPolicy(req.user, requireCashOpen);
  }

  // Base contable de los reportes (CASH | ACCRUAL). Lo elige el dueño.
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('accounting-basis')
  updateAccountingBasis(@Body('basis') basis: string, @Req() req) {
    return this.service.updateAccountingBasis(req.user, basis);
  }

  // Cierre de periodo: fija/reabre la fecha de cierre de libros.
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('books-close')
  updateBooksClose(@Body('date') date: string | null, @Req() req) {
    return this.service.updateBooksClose(req.user, date);
  }

  // Interruptor de la sección Contabilidad (activos, etc.). Lo activa el dueño.
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('accounting-enabled')
  updateAccountingEnabled(
    @Body('enabled') enabled: boolean,
    @Req() req,
  ) {
    return this.service.updateAccountingEnabled(req.user, enabled);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('fiscal')
  updateFiscal(@Body() dto: any, @Req() req) {
    return this.service.updateFiscal(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('terminology')
  updateTerminology(@Body() dto: any, @Req() req) {
    return this.service.updateTerminology(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('profile')
  updateProfile(
    @Body()
    dto: { name?: string; logo?: string; phone?: string; email?: string },
    @Req() req,
  ) {
    return this.service.updateProfile(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('hours')
  updateHours(
    @Body() dto: { openHour?: number; closeHour?: number },
    @Req() req,
  ) {
    return this.service.updateHours(req.user, dto);
  }
}
