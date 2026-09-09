import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateFixedExpenseDto {
  @IsString()
  name: string;

  // Monto habitual (opcional). Si el valor cambia cada mes, se deja vacío y se
  // ingresa al momento de pagar. 0/vacío = "se define al pagar".
  @IsOptional()
  @IsNumber()
  amount?: number;

  // Día del mes en que se suele pagar (1-31). Opcional.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsInt()
  expenseCategoryId?: number;

  @IsOptional()
  @IsInt()
  localId?: number;

  @IsOptional()
  @IsInt()
  providerId?: number;

  @IsOptional()
  @IsString()
  paidTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
