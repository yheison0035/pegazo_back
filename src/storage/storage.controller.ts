import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { StorageService } from './storage.service';
import { CheckInDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { StorageSettingsDto } from './dto/settings.dto';

// GUARDA CASCOS — custodia de cascos. Operan dueño, administrador, recepcionista,
// asesor y cajero; la configuración de tarifas solo el dueño/administrador.
const OPERATE = ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'ASESOR', 'CAJA'];
const OWNER = ['SUPER_ADMIN', 'ADMIN'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Roles(...OPERATE)
  @Get()
  list(@Req() req) {
    return this.service.listActive(req.user);
  }

  @Roles(...OPERATE)
  @Get('history')
  history(@Req() req, @Query('limit') limit?: string) {
    return this.service.history(req.user, Number(limit) || 30);
  }

  @Roles(...OPERATE)
  @Get('settings')
  getSettings(@Req() req) {
    return this.service.getSettings(req.user);
  }

  @Roles(...OWNER)
  @Patch('settings')
  updateSettings(@Req() req, @Body() dto: StorageSettingsDto) {
    return this.service.updateSettings(req.user, dto);
  }

  @Roles(...OPERATE)
  @Post('checkin')
  checkIn(@Req() req, @Body() dto: CheckInDto) {
    return this.service.checkIn(req.user, dto);
  }

  @Roles(...OPERATE)
  @Get(':id/quote')
  quote(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.quote(req.user, id);
  }

  @Roles(...OPERATE)
  @Patch(':id/wash')
  wash(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() b: any) {
    return this.service.toggleWash(req.user, id, b?.done !== false);
  }

  @Roles(...OPERATE)
  @Post(':id/checkout')
  checkout(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckoutDto,
  ) {
    return this.service.checkout(req.user, id, dto);
  }

  @Roles(...OWNER)
  @Post(':id/cancel')
  cancel(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(req.user, id);
  }
}
