import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { FiscalConsumersService } from './fiscal-consumers.service';

// Facturación como servicio: gestión de plataformas externas que consumen la API
// fiscal (generador de factura/nómina electrónica). Solo plataforma Pegazo.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_PLATFORM_ADMIN')
@Controller('fiscal-consumers')
export class FiscalConsumersController {
  constructor(private readonly service: FiscalConsumersService) {}

  @Get()
  list(@Req() req) {
    return this.service.list(req.user);
  }

  @Post()
  create(@Body() dto: { name: string }, @Req() req) {
    return this.service.create(req.user, dto?.name);
  }

  @Patch(':id')
  toggle(@Param('id') id: string, @Body() dto: { active: boolean }, @Req() req) {
    return this.service.toggle(req.user, id, dto?.active !== false);
  }

  @Get(':id/keys')
  listKeys(@Param('id') id: string, @Req() req) {
    return this.service.listKeys(req.user, id);
  }

  @Post(':id/keys')
  createKey(@Param('id') id: string, @Body() dto: { label?: string }, @Req() req) {
    return this.service.createKey(req.user, id, dto?.label || '');
  }

  @Patch('keys/:keyId/revoke')
  revokeKey(@Param('keyId') keyId: string, @Req() req) {
    return this.service.revokeKey(req.user, keyId);
  }
}
