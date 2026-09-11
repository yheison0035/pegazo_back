import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { AccountantService } from './accountant.service';

@Controller('accountant')
export class AccountantController {
  constructor(
    private readonly service: AccountantService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/auxiliary')
  cAuxiliary(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyAuxiliary(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/entries')
  cEntriesList(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyEntriesList(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('companies/:companyId/entries')
  cEntryCreate(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Body() dto) {
    return this.service.companyEntryCreate(req.user.id, companyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Delete('companies/:companyId/entries/:entryId')
  cEntryDelete(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.service.companyEntryDelete(req.user.id, companyId, entryId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('companies/:companyId/import')
  cImport(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Body('rows') rows: any[]) {
    return this.service.companyImport(req.user.id, companyId, rows);
  }

  // Sube un documento soporte (factura/recibo, PDF o imagen) a Cloudinary.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('companies/:companyId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
      fileFilter: (_req, file, cb) => {
        if (!/^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(file.mimetype))
          return cb(new BadRequestException('Solo PDF o imagen.'), false);
        cb(null, true);
      },
    }),
  )
  async cUpload(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.service.ensureAccess(req.user.id, companyId);
    if (!file) throw new BadRequestException('No se recibió el archivo.');
    const { url } = await this.cloudinary.uploadFile(file, 'accounting');
    return { success: true, data: { url, name: file.originalname } };
  }

  // ----- Terceros de una empresa enlazada -----
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Get('companies/:companyId/parties')
  cParties(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Query() q) {
    return this.service.companyPartiesList(req.user.id, companyId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Post('companies/:companyId/parties')
  cPartyCreate(@Req() req, @Param('companyId', ParseIntPipe) companyId: number, @Body() dto) {
    return this.service.companyPartyCreate(req.user.id, companyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Patch('companies/:companyId/parties/:partyId')
  cPartyUpdate(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('partyId', ParseIntPipe) partyId: number,
    @Body() dto,
  ) {
    return this.service.companyPartyUpdate(req.user.id, companyId, partyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ACCOUNTANT')
  @Delete('companies/:companyId/parties/:partyId')
  cPartyDelete(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('partyId', ParseIntPipe) partyId: number,
  ) {
    return this.service.companyPartyDelete(req.user.id, companyId, partyId);
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
