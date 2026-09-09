import { IsOptional, IsString } from 'class-validator';

export class UpdatePlatformPaymentDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountType?: string; // AHORROS | CORRIENTE

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
