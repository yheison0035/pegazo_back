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
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PayMembershipDto } from './dto/pay-membership.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA')
  @Get()
  list(@Req() req) {
    return this.service.list(req.user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post()
  create(@Req() req, @Body() dto: CreateMembershipDto) {
    return this.service.create(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user, id);
  }

  // Cobrar la mensualidad (fecha + observación).
  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA')
  @Post(':id/charge')
  charge(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayMembershipDto,
  ) {
    return this.service.charge(req.user, id, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post(':id/uncharge')
  uncharge(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.uncharge(req.user, id);
  }
}
