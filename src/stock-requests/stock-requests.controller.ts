import {
  Body,
  Controller,
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
import { StockRequestsService } from './stock-requests.service';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { DecideStockRequestDto } from './dto/reject-stock-request.dto';

// Quiénes pueden CREAR una solicitud: los mismos que llegan a editar inventario
// sin ser dueño/admin. Se deja el set amplio; el servicio bloquea a dueño/admin
// (ellos aplican directo) y valida que realmente haya una disminución.
const REQUESTER_ROLES = [
  'RECEPCIONISTA',
  'BODEGUERO',
  'ASESOR',
  'COORDINADOR',
  'AUXILIAR',
];
const APPROVER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

@Controller('stock-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockRequestsController {
  constructor(private readonly service: StockRequestsService) {}

  @Roles(...REQUESTER_ROLES)
  @Post()
  create(@Req() req, @Body() dto: CreateStockRequestDto) {
    return this.service.create(req.user, dto);
  }

  @Roles(...APPROVER_ROLES)
  @Get()
  list(@Req() req, @Query('status') status?: string) {
    return this.service.list(req.user, status);
  }

  @Roles(...APPROVER_ROLES)
  @Get('pending-count')
  pendingCount(@Req() req) {
    return this.service.pendingCount(req.user);
  }

  @Roles(...REQUESTER_ROLES, ...APPROVER_ROLES)
  @Get('mine')
  mine(@Req() req) {
    return this.service.mine(req.user);
  }

  @Roles(...APPROVER_ROLES)
  @Patch(':id/approve')
  approve(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideStockRequestDto,
  ) {
    return this.service.approve(req.user, id, dto);
  }

  @Roles(...APPROVER_ROLES)
  @Patch(':id/reject')
  reject(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideStockRequestDto,
  ) {
    return this.service.reject(req.user, id, dto);
  }
}
