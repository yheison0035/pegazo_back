import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Gestión de CONSUMIDORES de la API fiscal (plataformas externas que consumen el
// generador de facturas/nómina electrónica). Proxy a los endpoints /v1/admin de
// la Fiscal API, protegidos por x-bootstrap-secret. Solo SUPER_PLATFORM_ADMIN.
@Injectable()
export class FiscalConsumersService {
  private get baseUrl() {
    return (
      process.env.FISCAL_API_URL ||
      'https://pegazo-fiscal-api-production.up.railway.app'
    ).replace(/\/$/, '');
  }

  private assertPlatform(user: any) {
    if (user?.role !== 'SUPER_PLATFORM_ADMIN')
      throw new ForbiddenException('No tienes permisos');
  }

  private async admin(path: string, init: RequestInit = {}): Promise<any> {
    const secret = process.env.FISCAL_BOOTSTRAP_SECRET;
    if (!secret)
      throw new BadRequestException(
        'Falta FISCAL_BOOTSTRAP_SECRET para gestionar consumidores de la API fiscal.',
      );
    const res = await fetch(`${this.baseUrl}/v1/admin${path}`, {
      ...init,
      headers: {
        'x-bootstrap-secret': secret,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = `Fiscal API ${res.status}`;
      try {
        const j = await res.json();
        msg = j.message || msg;
      } catch {
        /* sin cuerpo JSON */
      }
      throw new BadRequestException(msg);
    }
    return res.status === 204 ? { success: true } : res.json();
  }

  async list(user: any) {
    this.assertPlatform(user);
    const data = await this.admin('/platforms');
    return { success: true, data };
  }

  async create(user: any, name: string) {
    this.assertPlatform(user);
    const n = String(name || '').trim();
    if (!n) throw new BadRequestException('El nombre es obligatorio.');
    // Devuelve la API key EN CLARO una sola vez.
    const data = await this.admin('/platforms', {
      method: 'POST',
      body: JSON.stringify({ name: n }),
    });
    return { success: true, data };
  }

  async toggle(user: any, id: string, active: boolean) {
    this.assertPlatform(user);
    const data = await this.admin(`/platforms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
    return { success: true, data };
  }

  async setPlan(user: any, id: string, dto: any) {
    this.assertPlatform(user);
    const data = await this.admin(`/platforms/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify(dto || {}),
    });
    return { success: true, data };
  }

  async listKeys(user: any, id: string) {
    this.assertPlatform(user);
    const data = await this.admin(`/platforms/${id}/api-keys`);
    return { success: true, data };
  }

  async createKey(user: any, platformId: string, label: string) {
    this.assertPlatform(user);
    const data = await this.admin('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ platformId, label: label || 'default' }),
    });
    return { success: true, data };
  }

  async revokeKey(user: any, id: string) {
    this.assertPlatform(user);
    const data = await this.admin(`/api-keys/${id}/revoke`, {
      method: 'PATCH',
    });
    return { success: true, data };
  }
}
