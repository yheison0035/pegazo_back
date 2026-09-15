import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { WebsiteGuard } from '@/common/guards/website.guard';
import { Website } from '@/common/decorators/website.decorator';
import { WebsiteContext } from './interfaces/website-context.interface';
import { WebsiteService } from './website.service';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import {
  CreateWebsiteBannerDto,
  UpdateWebsiteBannerDto,
} from './dto/website-banner.dto';

@Controller('website')
export class WebsiteController {
  constructor(private readonly service: WebsiteService) {}

  /** Configuración pública: la consume la tienda según su dominio. */
  @Public()
  @UseGuards(WebsiteGuard)
  @Get('config')
  getConfig(@Website() website: WebsiteContext) {
    return website;
  }

  /* ==========================================================
     DOCUMENTOS LEGALES (editables por el dueño DESDE la tienda)
     ========================================================== */

  // Contenido legal público (lo lee la tienda por dominio).
  @Public()
  @UseGuards(WebsiteGuard)
  @Get('legal')
  getLegal(@Website() website: WebsiteContext) {
    return this.service.getLegal(website);
  }

  // Botón "Editar mi tienda" del CRM: genera el token de edición del dueño.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Get('edit-token')
  createEditToken(@Req() req) {
    return this.service.createEditToken(req.user);
  }

  // Login del dueño DESDE la tienda (credenciales del CRM) → token de edición.
  @Public()
  @UseGuards(WebsiteGuard)
  @Post('owner/login')
  ownerLogin(
    @Website() website: WebsiteContext,
    @Body() body: { email?: string; password?: string },
  ) {
    return this.service.ownerLogin(website, body?.email, body?.password);
  }

  // Guardar un documento legal (requiere token de edición en Authorization).
  @Public()
  @UseGuards(WebsiteGuard)
  @Put('legal')
  saveLegal(
    @Website() website: WebsiteContext,
    @Headers('authorization') auth: string,
    @Body() body: { slug: string; title?: string; html?: string },
  ) {
    return this.service.saveLegal(website, auth, body);
  }

  /* ==========================================================
     ADMINISTRACIÓN DEL SITIO (desde el CRM)
     ========================================================== */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Get('admin/config')
  getAdminConfig(@Req() req, @Query('companyId') companyId?: string) {
    return this.service.getAdminConfig(
      req.user,
      companyId ? Number(companyId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Put('admin/config')
  updateConfig(
    @Req() req,
    @Body() dto: UpdateWebsiteDto,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.updateConfig(
      req.user,
      dto,
      companyId ? Number(companyId) : undefined,
    );
  }

  /** Sube una imagen del sitio (logo, favicon o banner) y devuelve su URL. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Post('admin/upload')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.uploadImage(
      req.user,
      file,
      companyId ? Number(companyId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Post('admin/banners')
  createBanner(
    @Req() req,
    @Body() dto: CreateWebsiteBannerDto,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.createBanner(
      req.user,
      dto,
      companyId ? Number(companyId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Put('admin/banners/:id')
  updateBanner(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebsiteBannerDto,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.updateBanner(
      req.user,
      id,
      dto,
      companyId ? Number(companyId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SUPER_PLATFORM_ADMIN')
  @Delete('admin/banners/:id')
  removeBanner(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.removeBanner(
      req.user,
      id,
      companyId ? Number(companyId) : undefined,
    );
  }
}
