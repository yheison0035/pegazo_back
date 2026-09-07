import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class StorageSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dayRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  washPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  graceMinutes?: number;

  @IsOptional()
  @IsIn(['HORA', 'DIA', 'MENSUALIDAD'])
  defaultMode?: string;
}
