import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma.service';

// Alfabeto sin caracteres ambiguos (0/O, 1/I) para la llave.
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AccountantService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private randomKey(): string {
    let s = '';
    for (let i = 0; i < 8; i++)
      s += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
    return `PZ-${s}`;
  }

  private async uniqueKey(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const key = this.randomKey();
      const exists = await this.prisma.accountant.findUnique({
        where: { accountantKey: key },
      });
      if (!exists) return key;
    }
    // Extremadamente improbable; añade sufijo temporal.
    return `PZ-${Date.now().toString(36).toUpperCase()}`;
  }

  private token(a: any) {
    return this.jwt.sign({
      sub: a.id,
      email: a.email,
      name: a.name,
      role: 'ACCOUNTANT',
    });
  }

  private publicProfile(a: any) {
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      accountantKey: a.accountantKey,
      status: a.status,
    };
  }

  async register(dto: any) {
    const email = String(dto.email || '').trim().toLowerCase();
    const name = String(dto.name || '').trim();
    const password = String(dto.password || '');
    if (!name || name.length < 2)
      throw new BadRequestException('El nombre es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException('Correo no válido.');
    if (password.length < 6)
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');

    // El correo no debe existir ni como contador ni como usuario de empresa.
    const dupA = await this.prisma.accountant.findUnique({ where: { email } });
    if (dupA) throw new ConflictException('Ya existe una cuenta con ese correo.');

    const hashed = await bcrypt.hash(password, 10);
    const accountantKey = await this.uniqueKey();
    const a = await this.prisma.accountant.create({
      data: {
        name,
        email,
        password: hashed,
        phone: dto.phone ? String(dto.phone).trim() : null,
        accountantKey,
      },
    });
    return {
      success: true,
      data: { access_token: this.token(a), accountant: this.publicProfile(a) },
    };
  }

  async login(dto: any) {
    const email = String(dto.email || '').trim().toLowerCase();
    const a = await this.prisma.accountant.findUnique({ where: { email } });
    if (!a) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    const ok = await bcrypt.compare(String(dto.password || ''), a.password);
    if (!ok) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    if (a.status !== 'ACTIVO')
      throw new UnauthorizedException('Tu cuenta está inactiva.');
    return {
      success: true,
      data: { access_token: this.token(a), accountant: this.publicProfile(a) },
    };
  }

  async me(accountantId: number) {
    const a = await this.prisma.accountant.findUnique({
      where: { id: accountantId },
    });
    if (!a) throw new UnauthorizedException('Cuenta no encontrada.');
    return { success: true, data: this.publicProfile(a) };
  }
}
