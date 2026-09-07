import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PayMembershipDto {
  // Fecha real del cobro (para el reporte del periodo correcto).
  @IsDateString()
  paidDate: string;

  // Monto cobrado (si no viene, se usa el de la membresía).
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
