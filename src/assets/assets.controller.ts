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
import { AssetsService } from './assets.service';

// Activos fijos (Contabilidad). Información financiera sensible: solo el dueño
// (SUPER_ADMIN) y el administrador (ADMIN).
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get()
  findAll(@Req() req, @Query() query) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(req.user, id);
  }

  @Post()
  create(@Req() req, @Body() dto) {
    return this.service.create(req.user, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.service.update(req.user, id, dto);
  }

  @Patch(':id/dispose')
  dispose(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.service.dispose(req.user, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user, id);
  }
}
