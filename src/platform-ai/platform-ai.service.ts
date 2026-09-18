import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import {
  GenerateProductContentDto,
  UpdatePlatformAiDto,
} from './dto/update-platform-ai.dto';

const DEFAULTS = {
  enabled: false,
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.6-flash',
  baseUrl: '',
};

@Injectable()
export class PlatformAiService {
  constructor(private readonly prisma: PrismaService) {}

  /** Config cruda (incluye la key) — SOLO para uso interno del servidor. */
  private async getRaw() {
    let s = await this.prisma.platformAiSettings.findUnique({ where: { id: 1 } });
    if (!s) {
      s = await this.prisma.platformAiSettings.create({
        data: { id: 1, ...DEFAULTS },
      });
    }
    return s;
  }

  /** Config para el frontend: NO expone la key completa, solo si existe. */
  async get() {
    const s = await this.getRaw();
    return {
      success: true,
      data: {
        enabled: s.enabled,
        provider: s.provider,
        model: s.model,
        baseUrl: s.baseUrl,
        hasKey: !!s.apiKey,
        keyPreview: s.apiKey ? `••••${s.apiKey.slice(-4)}` : '',
      },
    };
  }

  async update(dto: UpdatePlatformAiDto) {
    const data: Record<string, unknown> = {};
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.provider !== undefined) data.provider = dto.provider.trim();
    if (dto.model !== undefined) data.model = dto.model.trim();
    if (dto.baseUrl !== undefined) data.baseUrl = dto.baseUrl.trim();
    // La key solo se cambia si mandan una nueva (no vacía): así el super admin
    // puede editar el resto sin volver a escribir la key cada vez.
    if (dto.apiKey && dto.apiKey.trim()) data.apiKey = dto.apiKey.trim();

    await this.prisma.platformAiSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...DEFAULTS, ...data },
    });

    return this.get();
  }

  // ---------------------------------------------------------------------------
  // Generación de contenido de producto a partir del nombre.
  // ---------------------------------------------------------------------------
  async generateProductContent(dto: GenerateProductContentDto) {
    const name = (dto.name || '').trim();
    if (!name) throw new BadRequestException('Falta el nombre del producto');

    const cfg = await this.getRaw();
    if (!cfg.enabled) {
      throw new ServiceUnavailableException(
        'La generación con IA está desactivada. Actívala en la configuración de la plataforma.',
      );
    }
    if (!cfg.apiKey) {
      throw new ServiceUnavailableException(
        'Falta la API key de IA. Configúrala en la plataforma.',
      );
    }

    const field = dto.field || 'all';
    const existing = Array.isArray(dto.existing)
      ? dto.existing.filter(Boolean)
      : [];
    const prompt = this.buildPrompt(
      name,
      field,
      existing,
      dto.category,
      dto.brand,
    );

    let raw: string;
    try {
      raw =
        cfg.provider === 'openai'
          ? await this.callOpenAiCompatible(cfg, prompt)
          : await this.callGemini(cfg, prompt);
    } catch (e: any) {
      throw new ServiceUnavailableException(
        'No se pudo generar con IA. ' + String(e?.message || '').slice(0, 300),
      );
    }

    const json = this.extractJson(raw);

    if (field === 'description') {
      return {
        success: true,
        data: {
          description:
            typeof json.description === 'string' ? json.description : '',
        },
      };
    }
    if (field === 'feature') {
      const feature =
        (typeof json.feature === 'string' && json.feature.trim()) ||
        (Array.isArray(json.features) && json.features[0]) ||
        '';
      return { success: true, data: { feature: String(feature).trim() } };
    }
    if (field === 'specification') {
      const spec =
        json.specification ||
        (Array.isArray(json.specifications) && json.specifications[0]) ||
        {};
      return {
        success: true,
        data: {
          specification: {
            key: String(spec.key || '').trim(),
            value: String(spec.value || '').trim(),
          },
        },
      };
    }

    // field === 'all'
    return {
      success: true,
      data: {
        description:
          typeof json.description === 'string' ? json.description : '',
        features: Array.isArray(json.features)
          ? json.features
              .filter((x: unknown) => typeof x === 'string' && x.trim())
              .slice(0, 8)
              .map((t: string) => ({ title: t.trim() }))
          : [],
        specifications: Array.isArray(json.specifications)
          ? json.specifications
              .filter((s: any) => s && s.key && s.value)
              .slice(0, 12)
              .map((s: any) => ({
                key: String(s.key).trim(),
                value: String(s.value).trim(),
              }))
          : [],
      },
    };
  }

  private buildPrompt(
    name: string,
    field: string,
    existing: string[],
    category?: string,
    brand?: string,
  ) {
    const ctx = [
      category ? `Categoría: ${category}` : '',
      brand ? `Marca: ${brand}` : '',
    ]
      .filter(Boolean)
      .join('. ');

    const base = `Eres redactor de e-commerce en Colombia (estilo Mercado Libre). Escribe en español, claro y honesto. Producto: "${name}".${
      ctx ? ' ' + ctx + '.' : ''
    } Si el nombre trae marca/modelo, respétalo; NO afirmes que es una marca famosa si no está claro.`;

    if (field === 'description') {
      return `${base}
Redacta SOLO la descripción: 2 a 4 frases persuasivas, en HTML simple con <p> y <strong> (sin encabezados ni listas).
Responde ÚNICAMENTE JSON válido: {"description":"<p>...</p>"}`;
    }

    if (field === 'feature') {
      const ex = existing.length
        ? ` Ya existen estas (NO las repitas): ${existing
            .map((e) => `"${e}"`)
            .join(', ')}.`
        : '';
      return `${base}
Da UNA sola característica (beneficio corto, frase completa, sin viñetas ni HTML).${ex}
Responde ÚNICAMENTE JSON válido: {"feature":"..."}`;
    }

    if (field === 'specification') {
      const ex = existing.length
        ? ` Ya existen estas claves (NO las repitas): ${existing
            .map((e) => `"${e}"`)
            .join(', ')}.`
        : '';
      return `${base}
Da UNA sola especificación técnica típica en formato clave/valor (valor general; no inventes cifras muy específicas).${ex}
Responde ÚNICAMENTE JSON válido: {"specification":{"key":"...","value":"..."}}`;
    }

    return `${base}
- Descripción: 2 a 4 frases en HTML <p>/<strong> (sin listas).
- Características: 4 a 5 beneficios cortos.
- Especificaciones: 3 a 6 pares clave/valor típicos.
Responde ÚNICAMENTE JSON válido, sin markdown:
{"description":"<p>...</p>","features":["...","..."],"specifications":[{"key":"...","value":"..."}]}`;
  }

  private async callGemini(cfg: { apiKey: string; model: string }, prompt: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      cfg.model,
    )}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          // Los modelos Gemini 3.x "piensan" antes de responder; sin esto se
          // gastan los tokens pensando y el texto sale vacío. Lo desactivamos.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    // Solo el texto de la RESPUESTA (descarta las partes de "pensamiento").
    return parts
      .filter((p: any) => !p?.thought)
      .map((p: any) => p?.text || '')
      .join('');
  }

  private async callOpenAiCompatible(
    cfg: { apiKey: string; model: string; baseUrl: string },
    prompt: string,
  ) {
    const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenAI-compat ${res.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  /** Extrae el primer objeto JSON del texto (tolerante a ```json ... ```). */
  private extractJson(text: string): any {
    if (!text) return {};
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return {};
    }
  }
}
