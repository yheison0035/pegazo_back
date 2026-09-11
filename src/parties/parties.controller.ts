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
import { PartiesService } from './parties.service';

// Terceros contables de la propia empresa (dueño/admin/contador interno).
@Controller('parties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
export class PartiesController {
  constructor(private readonly service: PartiesService) {}

  @Get()
  list(@Req() req, @Query() q) {
    return this.service.list(req.user.companyId, q);
  }

  @Post()
  create(@Req() req, @Body() dto) {
    return this.service.create(req.user.companyId, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.service.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.companyId, id);
  }
}
