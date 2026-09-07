import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateMembershipDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsInt()
  localId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
