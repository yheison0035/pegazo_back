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
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { AccountingService } from './accounting.service';
import { ManualEntriesService } from './manual-entries.service';

// Libros contables derivados (Contabilidad). Solo dueño y admin.
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'CONTADOR')
export class AccountingController {
  constructor(
    private readonly service: AccountingService,
    private readonly manualEntries: ManualEntriesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // Asientos manuales de la propia empresa (dueño/admin/contador interno).
  @Get('entries')
  listEntries(@Req() req, @Query() q) {
    return this.manualEntries.list(req.user.companyId, q);
  }

  @Post('entries')
  createEntry(@Req() req, @Body() dto) {
    return this.manualEntries.create(req.user.companyId, dto);
  }

  @Patch('entries/:id')
  updateEntry(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto) {
    return this.manualEntries.update(req.user.companyId, id, dto);
  }

  @Delete('entries/:id')
  removeEntry(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.manualEntries.remove(req.user.companyId, id);
  }

  // Documento soporte de un asiento (factura/recibo, PDF o imagen).
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
      fileFilter: (_req, file, cb) => {
        if (
          !/^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(
            file.mimetype,
          )
        )
          return cb(new BadRequestException('Solo PDF o imagen.'), false);
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió el archivo.');
    const { url } = await this.cloudinary.uploadFile(file, 'accounting');
    return { success: true, data: { url, name: file.originalname } };
  }

  @Post('entries/import')
  importEntries(@Req() req, @Body('rows') rows: any[]) {
    return this.manualEntries.bulkImport(req.user.companyId, rows);
  }

  @Get('journal')
  journal(@Req() req, @Query() query) {
    return this.service.journal(req.user, query);
  }

  @Get('ledger')
  ledger(@Req() req, @Query() query) {
    return this.service.ledger(req.user, query);
  }

  @Get('financials')
  financials(@Req() req, @Query() query) {
    return this.service.financials(req.user, query);
  }

  @Get('auxiliary')
  auxiliary(@Req() req, @Query() query) {
    return this.service.auxiliary(req.user, query);
  }

  @Get('tax-summary')
  taxSummary(@Req() req, @Query() query) {
    return this.service.taxSummary(req.user, query);
  }
}
