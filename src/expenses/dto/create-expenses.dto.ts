import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ExpenseType, PaymentMethod, Status } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  concept: string;

  // Tipo de gasto: ahora se elige por categoría administrable (expenseCategoryId);
  // el enum `type` queda opcional y se deriva en el backend para compatibilidad.
  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @IsOptional()
  @IsInt()
  expenseCategoryId?: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  paidTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Retenciones practicadas al tercero (opcionales).
  @IsOptional()
  @IsNumber()
  @Min(0)
  retefuente?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reteica?: number;

  @IsDateString()
  expenseDate: string;

  @IsInt()
  localId: number;

  @IsOptional()
  @IsInt()
  providerId?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
