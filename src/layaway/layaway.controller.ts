import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { LayawayService } from './layaway.service';

@Controller('layaway')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA', 'CAJA', 'ASESOR')
export class LayawayController {
  constructor(private readonly service: LayawayService) {}

  @Get()
  list(@Req() req, @Query('status') status?: string) {
    return this.service.list(req.user, (status || 'ACTIVO').toUpperCase());
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.detail(req.user, id);
  }

  @Post()
  create(@Body() dto: any, @Req() req) {
    return this.service.create(req.user, dto);
  }

  @Post(':id/payment')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req,
  ) {
    return this.service.addPayment(req.user, id, dto);
  }

  @Put(':id/items')
  updateItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req,
  ) {
    return this.service.updateItems(req.user, id, dto);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Req() req,
  ) {
    return this.service.complete(req.user, id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.cancel(req.user, id);
  }
}
