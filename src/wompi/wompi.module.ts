import { Module } from '@nestjs/common';
import { WompiController } from './wompi.controller';
import { WompiService } from './wompi.service';
import { PrismaService } from '@/prisma.service';
import { WebsiteModule } from '@/modules/website/website.module';
import { MailService } from '@/mail/mail.service';

@Module({
  imports: [WebsiteModule],
  controllers: [WompiController],
  providers: [WompiService, PrismaService, MailService],
  exports: [WompiService],
})
export class WompiModule {}
