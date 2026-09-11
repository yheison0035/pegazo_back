import { Module } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { AccountantController } from './accountant.controller';
import { PrismaService } from '@/prisma.service';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule], // JwtModule (firmar token) + estrategia jwt
  controllers: [AccountantController],
  providers: [AccountantService, PrismaService],
})
export class AccountantModule {}
