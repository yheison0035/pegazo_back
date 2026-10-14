import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompanyLogoController } from './company-logo.controller';
import { CompanySettingsController } from './company-settings.controller';
import { PublicClientsController } from './companies.public.controller';
import { PrismaService } from '@/prisma.service';
import { MailService } from '@/mail/mail.service';

@Module({
  controllers: [
    CompaniesController,
    CompanyLogoController,
    CompanySettingsController,
    PublicClientsController,
  ],
  providers: [CompaniesService, PrismaService, MailService],
})
export class CompaniesModule {}
