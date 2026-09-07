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
import { FixedExpensesService } from './fixed-expenses.service';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { PayFixedExpenseDto } from './dto/pay-fixed-expense.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fixed-expenses')
export class FixedExpensesController {
  constructor(private readonly service: FixedExpensesService) {}

  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA')
  @Get()
  list(@Req() req) {
    return this.service.list(req.user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post()
  create(@Req() req, @Body() dto: CreateFixedExpenseDto) {
    return this.service.create(req.user, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFixedExpenseDto,
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user, id);
  }

  // Pagar el gasto fijo (crea el gasto real con fecha y observación).
  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPCIONISTA')
  @Post(':id/pay')
  pay(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayFixedExpenseDto,
  ) {
    return this.service.pay(req.user, id, dto);
  }

  // Deshacer el pago del mes actual.
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post(':id/unpay')
  unpay(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.unpay(req.user, id);
  }
}
