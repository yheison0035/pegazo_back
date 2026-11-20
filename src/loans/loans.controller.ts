import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { LoansService } from './loans.service';
import { LoanRemindersService } from './loan-reminders.service';
import {
  CreateLoanDto,
  CreditProfileDto,
  DisburseLoanDto,
  ExtraCapitalDto,
  LoanPaymentDto,
  RefinanceLoanDto,
  SettleLoanDto,
  LoanProductDto,
  LoanSettingsDto,
  ReasonDto,
  SimulateLoanDto,
} from './dto/loan.dto';

// Préstamos (tipo de negocio FINANCIERA). Además de @Roles, el servicio valida
// que el módulo 'prestamos' esté habilitado para la empresa (tipo / manual /
// plan) y acota al COBRADOR a su propia cartera.
const OWNER = ['SUPER_ADMIN', 'ADMIN'] as const;
const READ = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'ANALISTA', 'CAJA', 'COBRADOR', 'CONTADOR'] as const;
const CREATE = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'CAJA'] as const;
const DISBURSE = ['SUPER_ADMIN', 'ADMIN', 'CAJA'] as const;
const PAY = ['SUPER_ADMIN', 'ADMIN', 'CAJA', 'COBRADOR'] as const;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(
    private readonly service: LoansService,
    private readonly reminders: LoanRemindersService,
  ) {}

  // --- Configuración ---
  @Roles(...READ)
  @Get('settings')
  settings(@Req() req) {
    return this.service.settings(req.user);
  }

  @Roles(...OWNER)
  @Patch('settings')
  updateSettings(@Req() req, @Body() dto: LoanSettingsDto) {
    return this.service.updateSettings(req.user, dto);
  }

  // --- Productos de crédito ---
  @Roles(...READ)
  @Get('products')
  products(@Req() req, @Query('all') all?: string) {
    return this.service.listProducts(req.user, all === 'true' || all === '1');
  }

  @Roles(...OWNER)
  @Post('products')
  createProduct(@Req() req, @Body() dto: LoanProductDto) {
    return this.service.createProduct(req.user, dto);
  }

  @Roles(...OWNER)
  @Patch('products/:id')
  updateProduct(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: Partial<LoanProductDto>) {
    return this.service.updateProduct(req.user, id, dto);
  }

  @Roles(...OWNER)
  @Delete('products/:id')
  removeProduct(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.removeProduct(req.user, id);
  }

  // --- Perfil crediticio del cliente ---
  @Roles(...READ)
  @Get('customers/:customerId/profile')
  profile(@Req() req, @Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.getProfile(req.user, customerId);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'ANALISTA')
  @Put('customers/:customerId/profile')
  upsertProfile(@Req() req, @Param('customerId', ParseIntPipe) customerId: number, @Body() dto: CreditProfileDto) {
    return this.service.upsertProfile(req.user, customerId, dto);
  }

  // --- Simulador (no guarda) ---
  @Roles(...READ)
  @Post('simulate')
  simulate(@Req() req, @Body() dto: SimulateLoanDto) {
    return this.service.simulate(req.user, dto);
  }

  // --- Cobradores (para asignar cartera) ---
  @Roles(...READ)
  @Get('collectors')
  collectors(@Req() req) {
    return this.service.listCollectors(req.user);
  }

  // --- Reporte mensual (colocación vs recaudo) ---
  @Roles(...READ)
  @Get('reports/monthly')
  reportsMonthly(@Req() req, @Query() q: any) {
    return this.service.reportsMonthly(req.user, q);
  }

  // --- Resumen / KPIs, historial de abonos y ruta del cobrador ---
  @Roles(...READ)
  @Get('summary')
  summary(@Req() req, @Query() q: any) {
    return this.service.summary(req.user, q);
  }

  @Roles(...READ)
  @Get('payments/history')
  paymentsHistory(@Req() req, @Query() q: any) {
    return this.service.paymentsHistory(req.user, q);
  }

  @Roles(...READ)
  @Get('collector/route')
  collectorRoute(@Req() req, @Query() q: any) {
    return this.service.collectorRoute(req.user, q);
  }

  // --- Préstamos ---
  @Roles(...READ)
  @Get()
  list(@Req() req, @Query() q: any) {
    return this.service.list(req.user, q);
  }

  @Roles(...CREATE)
  @Post()
  create(@Req() req, @Body() dto: CreateLoanDto) {
    return this.service.create(req.user, dto);
  }

  @Roles(...READ)
  @Get(':id')
  detail(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.detail(req.user, id);
  }

  @Roles(...OWNER)
  @Post(':id/approve')
  approve(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.approve(req.user, id);
  }

  @Roles(...OWNER)
  @Post(':id/reject')
  reject(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: ReasonDto) {
    return this.service.reject(req.user, id, dto?.reason);
  }

  @Roles(...DISBURSE)
  @Post(':id/disburse')
  disburse(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: DisburseLoanDto) {
    return this.service.disburse(req.user, id, dto || {});
  }

  @Roles(...OWNER)
  @Post(':id/cancel')
  cancel(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: ReasonDto) {
    return this.service.cancel(req.user, id, dto?.reason);
  }

  // --- Abonos ---
  @Roles(...PAY)
  @Post(':id/payments')
  addPayment(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: LoanPaymentDto) {
    return this.service.addPayment(req.user, id, dto);
  }

  @Roles(...OWNER)
  @Post(':id/payments/:paymentId/annul')
  annulPayment(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: ReasonDto,
  ) {
    return this.service.annulPayment(req.user, id, paymentId, dto?.reason);
  }

  // --- Fase 2: abono a capital, liquidación, refinanciación, recordatorio ---
  @Roles(...READ)
  @Get(':id/extra-capital/quote')
  extraCapitalQuote(@Req() req, @Param('id', ParseIntPipe) id: number, @Query('amount') amount: string, @Query('mode') mode: string) {
    return this.service.extraCapitalQuote(req.user, id, Number(amount) || 0, mode === 'REDUCE_TERM' ? 'REDUCE_TERM' : 'REDUCE_INSTALLMENT');
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'CAJA')
  @Post(':id/extra-capital')
  extraCapital(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: ExtraCapitalDto) {
    return this.service.extraCapital(req.user, id, dto);
  }

  @Roles(...READ)
  @Get(':id/settlement/quote')
  settlementQuote(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.settlementQuote(req.user, id);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'CAJA')
  @Post(':id/settle')
  settle(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: SettleLoanDto) {
    return this.service.settle(req.user, id, dto || {});
  }

  @Roles(...OWNER)
  @Post(':id/refinance')
  refinance(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: RefinanceLoanDto) {
    return this.service.refinance(req.user, id, dto);
  }

  @Roles(...PAY)
  @Post(':id/reminder')
  reminder(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.reminders.sendNow(req.user, id);
  }
}
