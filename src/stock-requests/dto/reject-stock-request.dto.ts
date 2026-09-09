import { IsOptional, IsString } from 'class-validator';

export class DecideStockRequestDto {
  // Nota opcional del dueño/admin al aprobar o rechazar.
  @IsOptional()
  @IsString()
  note?: string;
}
