import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @IsInt()
  inventoryVariantId: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsInt()
  localId: number;

  @IsOptional()
  @IsInt()
  providerId?: number;

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

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
