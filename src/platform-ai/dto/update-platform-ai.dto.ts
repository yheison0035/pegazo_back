import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePlatformAiDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  provider?: string; // gemini | openai

  @IsOptional()
  @IsString()
  apiKey?: string; // si viene vacío, NO se sobreescribe la key guardada

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string; // solo para proveedores compatibles con OpenAI (Groq/OpenRouter)
}

export class GenerateProductContentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  // Qué generar: 'all' (todo), 'description', 'feature' (1), 'specification' (1).
  @IsOptional()
  @IsString()
  field?: string;

  // Para 'feature'/'specification': lo que ya existe, para no repetir.
  @IsOptional()
  existing?: string[];
}
