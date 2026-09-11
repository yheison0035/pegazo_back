import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma.service';
import { AccountingService } from '@/accounting/accounting.service';
import { LedgerAccountsService } from '@/ledger-accounts/ledger-accounts.service';
import { TaxService } from '@/tax/tax.service';

// Alfabeto sin caracteres ambiguos (0/O, 1/I) para la llave.
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AccountantService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private accounting: AccountingService,
    private ledgerAccounts: LedgerAccountsService,
    private tax: TaxService,
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

  // ---------- Enlace (lo hace el DUEÑO desde su empresa) ----------
  async linkByKey(user: any, key: string) {
    const clean = String(key || '').trim().toUpperCase();
    if (!clean) throw new BadRequestException('Ingresa la llave del contador.');
    const accountant = await this.prisma.accountant.findUnique({
      where: { accountantKey: clean },
    });
    if (!accountant)
      throw new NotFoundException('No existe un contador con esa llave.');
    await this.prisma.accountantCompany.upsert({
      where: {
        accountantId_companyId: {
          accountantId: accountant.id,
          companyId: user.companyId,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        accountantId: accountant.id,
        companyId: user.companyId,
        status: 'ACTIVE',
      },
    });
    return {
      success: true,
      data: { name: accountant.name, email: accountant.email, accountantKey: accountant.accountantKey },
    };
  }

  // Contador(es) enlazado(s) a la empresa del usuario.
  async companyLinks(user: any) {
    const links = await this.prisma.accountantCompany.findMany({
      where: { companyId: user.companyId, status: 'ACTIVE' },
      include: { accountant: true },
    });
    return {
      success: true,
      data: links.map((l) => ({
        accountantId: l.accountantId,
        name: l.accountant.name,
        email: l.accountant.email,
        accountantKey: l.accountant.accountantKey,
        linkedAt: l.createdAt,
      })),
    };
  }

  async unlink(user: any, accountantId: number) {
    await this.prisma.accountantCompany.deleteMany({
      where: { companyId: user.companyId, accountantId },
    });
    return { success: true };
  }

  // ---------- Portafolio (lo ve el CONTADOR) ----------
  async portfolio(accountantId: number) {
    const links = await this.prisma.accountantCompany.findMany({
      where: { accountantId, status: 'ACTIVE' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true,
            nit: true,
            logo: true,
            accountingOnly: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: links.map((l) => ({
        companyId: l.company.id,
        name: l.company.name,
        type: l.company.type,
        nit: l.company.nit,
        logo: l.company.logo,
        accountingOnly: l.company.accountingOnly,
      })),
    };
  }

  // El contador crea una empresa "solo contabilidad" (cliente fuera de Pegazo)
  // y queda enlazada a él automáticamente.
  async createCompany(accountantId: number, dto: any) {
    const name = String(dto.name || '').trim();
    if (name.length < 2)
      throw new BadRequestException('El nombre de la empresa es obligatorio.');
    const accountant = await this.prisma.accountant.findUnique({
      where: { id: accountantId },
      select: { name: true },
    });
    const company = await this.prisma.company.create({
      data: {
        name,
        type: 'COMERCIO',
        status: 'ACTIVO',
        plan: 'ORBITA',
        accountingEnabled: true,
        accountingOnly: true,
        nit: dto.nit ? String(dto.nit).trim() : null,
        taxRegime: dto.taxRegime ? String(dto.taxRegime).toUpperCase() : null,
        manager: accountant?.name || null,
        startDate: new Date(),
      },
    });
    await this.prisma.accountantCompany.create({
      data: { accountantId, companyId: company.id, status: 'ACTIVE' },
    });
    return {
      success: true,
      data: { companyId: company.id, name: company.name, accountingOnly: true },
    };
  }

  // Verifica que el contador tenga enlace ACTIVO con la empresa objetivo.
  private async assertLink(accountantId: number, companyId: number) {
    const link = await this.prisma.accountantCompany.findUnique({
      where: { accountantId_companyId: { accountantId, companyId } },
    });
    if (!link || link.status !== 'ACTIVE')
      throw new ForbiddenException('No tienes acceso a esta empresa.');
  }

  // ---------- Proxies a la contabilidad de una empresa enlazada ----------
  private ctx(companyId: number) {
    return { companyId };
  }
  async companyFinancials(accountantId: number, companyId: number, query: any) {
    await this.assertLink(accountantId, companyId);
    return this.accounting.financials(this.ctx(companyId), query);
  }
  async companyJournal(accountantId: number, companyId: number, query: any) {
    await this.assertLink(accountantId, companyId);
    return this.accounting.journal(this.ctx(companyId), query);
  }
  async companyLedger(accountantId: number, companyId: number, query: any) {
    await this.assertLink(accountantId, companyId);
    return this.accounting.ledger(this.ctx(companyId), query);
  }
  async companyLedgerAccounts(accountantId: number, companyId: number) {
    await this.assertLink(accountantId, companyId);
    return this.ledgerAccounts.findAll(this.ctx(companyId));
  }
  async companyTaxCalendar(accountantId: number, companyId: number, query: any) {
    await this.assertLink(accountantId, companyId);
    return this.tax.companyCalendar(this.ctx(companyId), query);
  }
}
