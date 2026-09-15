import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { PrismaService } from '@/prisma.service';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { PlanLimitsModule } from '@/common/plan-limits.module';

@Module({
  imports: [
    CloudinaryModule,
    PlanLimitsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [WebsiteController],
  providers: [WebsiteService, PrismaService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
