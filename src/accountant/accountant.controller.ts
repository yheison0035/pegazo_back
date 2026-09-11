import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { AccountantService } from './accountant.service';

@Controller('accountant')
export class AccountantController {
  constructor(private readonly service: AccountantService) {}

  // Públicos: registro e inicio de sesión del contador.
  @Post('register')
  register(@Body() dto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto) {
    return this.service.login(dto);
  }

  // ----- Contador autenticado -----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('me')
  me(@Req() req) {
    return this.service.me(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('portfolio')
  portfolio(@Req() req) {
    return this.service.portfolio(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('companies')
  createCompany(@Req() req, @Body() dto) {
    return this.service.createCompany(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/financials')
  cFinancials(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyFinancials(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/journal')
  cJournal(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyJournal(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/ledger')
  cLedger(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyLedger(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/ledger-accounts')
  cLedgerAccounts(@Req() req, @Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.companyLedgerAccounts(req.user.id, companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/tax-calendar')
  cTaxCalendar(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyTaxCalendar(req.user.id, companyId, q);
  }

  // ----- Empresa (dueño/admin): enlazar/ver/quitar contador -----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('link')
  link(@Req() req, @Body('key') key: string) {
    return this.service.linkByKey(req.user, key);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('link')
  links(@Req() req) {
    return this.service.companyLinks(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('link/:accountantId')
  unlink(@Req() req, @Param('accountantId', ParseIntPipe) accountantId: number) {
    return this.service.unlink(req.user, accountantId);
  }
}
