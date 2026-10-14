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
import { ParkingService } from './parking.service';

// PARQUEADERO — operan dueño, administrador, recepcionista, asesor y cajero; las
// tarifas/configuración solo dueño/administrador.
const OPERATE = ['SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'ASESOR', 'CAJA'];
const OWNER = ['SUPER_ADMIN', 'ADMIN'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking')
export class ParkingController {
  constructor(private readonly service: ParkingService) {}

  @Roles(...OPERATE)
  @Get()
  listActive(@Req() req) {
    return this.service.listActive(req.user);
  }

  @Roles(...OPERATE)
  @Get('history')
  history(@Query('limit') limit: string, @Req() req) {
    return this.service.history(req.user, Number(limit) || 30);
  }

  @Roles(...OPERATE)
  @Get('settings')
  getSettings(@Req() req) {
    return this.service.getSettings(req.user);
  }

  @Roles(...OWNER)
  @Patch('settings')
  updateSettings(@Body() dto: any, @Req() req) {
    return this.service.updateSettings(req.user, dto);
  }

  // Tipos de vehículo (tarifas)
  @Roles(...OPERATE)
  @Get('types')
  listTypes(@Req() req) {
    return this.service.listTypes(req.user);
  }

  @Roles(...OWNER)
  @Post('types')
  createType(@Body() dto: any, @Req() req) {
    return this.service.saveType(req.user, dto);
  }

  @Roles(...OWNER)
  @Patch('types/:id')
  updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req) {
    return this.service.saveType(req.user, dto, id);
  }

  @Roles(...OWNER)
  @Delete('types/:id')
  removeType(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.removeType(req.user, id);
  }

  // Operación
  @Roles(...OPERATE)
  @Post('checkin')
  checkIn(@Body() dto: any, @Req() req) {
    return this.service.checkIn(req.user, dto);
  }

  @Roles(...OPERATE)
  @Get(':id/quote')
  quote(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.quote(req.user, id);
  }

  @Roles(...OPERATE)
  @Post(':id/checkout')
  checkout(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req) {
    return this.service.checkout(req.user, id, dto);
  }

  @Roles(...OWNER)
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.cancel(req.user, id);
  }
}
