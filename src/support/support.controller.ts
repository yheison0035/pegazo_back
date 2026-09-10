import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(
    private readonly service: SupportService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // Sube un adjunto del chat (cliente o soporte) a Cloudinary y devuelve su URL.
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
          return cb(
            new BadRequestException('El adjunto debe ser una imagen.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen.');
    const { url, publicId } = await this.cloudinary.uploadImage(
      file,
      'support',
    );
    return { success: true, data: { url, publicId } };
  }

  // ----- Negocio (cualquier usuario autenticado de una empresa) -----
  @Get()
  clientThread(@Req() req) {
    return this.service.clientThread(req.user);
  }

  @Post()
  clientSend(
    @Req() req,
    @Body('body') body: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.service.clientSend(req.user, body, imageUrl);
  }

  @Get('unread-count')
  clientUnread(@Req() req) {
    return this.service.clientUnread(req.user);
  }

  // ----- Plataforma (soporte) -----
  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('threads')
  threads() {
    return this.service.threads();
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('platform/unread-count')
  platformUnread() {
    return this.service.platformUnread();
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Get('threads/:companyId')
  platformThread(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.platformThread(companyId);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_PLATFORM_ADMIN')
  @Post('threads/:companyId')
  platformSend(
    @Req() req,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body('body') body: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.service.platformSend(req.user, companyId, body, imageUrl);
  }
}
