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

@Controller('tax')
@UseGuards(JwtAuthGuard)
export class TaxController {
  constructor(private readonly service: TaxService) {}

  // ----- Empresa: su calendario (dueño, admin, contador) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
  @Get('calendar')
  calendar(@Req() req, @Query() query) {
    return this.service.companyCalendar(req.user, query);
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
