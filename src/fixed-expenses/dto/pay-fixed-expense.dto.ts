import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PayFixedExpenseDto {
  // Fecha real del pago (para que quede en el reporte del periodo correcto).
  @IsDateString()
  paymentDate: string;

  // Monto pagado (si no viene, se usa el monto del gasto fijo).
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
