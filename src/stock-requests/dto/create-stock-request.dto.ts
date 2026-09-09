import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class StockRequestLineDto {
  @IsInt()
  variantId: number;

  // Stock al que se quiere dejar la variante (menor al actual).
  @IsNumber()
  @Min(0)
  requestedStock: number;
}

export class CreateStockRequestDto {
  @IsInt()
  inventoryId: number;

  // Motivo obligatorio de por qué se quiere disminuir el stock.
  @IsString()
  @MinLength(3, { message: 'Explica el motivo de la disminución.' })
  reason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockRequestLineDto)
  lines: StockRequestLineDto[];
}
