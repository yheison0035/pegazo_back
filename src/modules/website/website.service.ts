import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { WebsiteContext } from './interfaces/website-context.interface';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import {
  CreateWebsiteBannerDto,
  UpdateWebsiteBannerDto,
} from './dto/website-banner.dto';
import { PlanLimitsService } from '@/common/plan-limits.service';

// Documentos legales editables desde la tienda (mismos slugs que el footer).
const LEGAL_DOCS: { slug: string; title: string }[] = [
  { slug: 'quienes-somos', title: 'Nuestra empresa' },
  { slug: 'terminos-y-condiciones', title: 'Términos y condiciones' },
  { slug: 'politicas-de-privacidad', title: 'Políticas de privacidad' },
  { slug: 'autorizacion-de-datos', title: 'Autorización de datos' },
  { slug: 'derecho-de-retracto', title: 'Derecho de retracto' },
  { slug: 'politica-de-envios', title: 'Política de envíos' },
  { slug: 'cambios-y-devoluciones', title: 'Cambios y devoluciones' },
  { slug: 'garantias', title: 'Política de garantías' },
  { slug: 'condiciones-de-promociones', title: 'Condiciones de promociones' },
];
const EDIT_ROLES: Role[] = ['SUPER_ADMIN' as Role, 'ADMIN' as Role];

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly planLimits: PlanLimitsService,
    private readonly jwt: JwtService,
  ) {}

  /* ==========================================================
     DOCUMENTOS LEGALES editables por el dueño DESDE la tienda
     ========================================================== */

  // Contenido legal de la tienda (por dominio). Devuelve la lista fija de
  // documentos con el texto guardado por la empresa (o vacío si no ha escrito).
  async getLegal(website: WebsiteContext) {
    const company = await this.prisma.company.findUnique({
      where: { id: website.companyId },
      select: { legalContent: true },
    });
    const stored: any = company?.legalContent || {};
    return {
      success: true,
      data: LEGAL_DOCS.map((d) => ({
        slug: d.slug,
        title: stored[d.slug]?.title || d.title,
        html: stored[d.slug]?.html || '',
      })),
    };
  }

  // Token de EDICIÓN de la tienda (para el botón del CRM). Lo firma un usuario
  // dueño/admin ya autenticado; sirve para editar la tienda de SU empresa.
  async createEditToken(user: any) {
    const token = await this.jwt.signAsync(
      { companyId: user.companyId, purpose: 'store-edit', role: user.role },
      { expiresIn: '8h' },
    );
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { domain: true },
    });
    const storeUrl = company?.domain
      ? `https://${company.domain}/?edit=${token}`
      : null;
    return { success: true, token, storeUrl };
  }

  // Login del DUEÑO desde la tienda (con sus credenciales del CRM). Valida que
  // sea dueño/admin de la empresa de ESTE dominio y devuelve el token de edición.
  async ownerLogin(website: WebsiteContext, email?: string, password?: string) {
    if (!email || !password) {
      throw new BadRequestException('Correo y contraseña son obligatorios.');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        companyId: website.companyId,
        status: 'ACTIVO' as Status,
        role: { in: EDIT_ROLES },
      },
    });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) {
      throw new UnauthorizedException(
        'Credenciales inválidas o no eres administrador de esta tienda.',
      );
    }
    const token = await this.jwt.signAsync(
      { companyId: user.companyId, purpose: 'store-edit', role: user.role },
      { expiresIn: '8h' },
    );
    return { success: true, token };
  }

  // Verifica un token de edición y que corresponda a la empresa del dominio.
  private async assertEditToken(website: WebsiteContext, authHeader?: string) {
    const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Falta el token de edición.');
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sesión de edición inválida o expirada.');
    }
    if (
      payload?.purpose !== 'store-edit' ||
      payload?.companyId !== website.companyId
    ) {
      throw new ForbiddenException('No puedes editar esta tienda.');
    }
    return payload;
  }

  // Guarda el contenido de UN documento legal (o varios) de la empresa.
  async saveLegal(
    website: WebsiteContext,
    authHeader: string | undefined,
    dto: { slug: string; title?: string; html?: string },
  ) {
    await this.assertEditToken(website, authHeader);
    const valid = LEGAL_DOCS.find((d) => d.slug === dto?.slug);
    if (!valid) throw new BadRequestException('Documento no válido.');

    const company = await this.prisma.company.findUnique({
      where: { id: website.companyId },
      select: { legalContent: true },
    });
    const content: any = { ...(company?.legalContent as any) };
    content[dto.slug] = {
      title: (dto.title ?? valid.title).toString(),
      html: (dto.html ?? '').toString(),
    };
    await this.prisma.company.update({
      where: { id: website.companyId },
      data: { legalContent: content },
    });
    return { success: true };
  }

  normalizeDomain(host: string): string {
    return host
      .replace('https://', '')
      .replace('http://', '')
      .replace('www.', '')
      .split(':')[0]
      .toLowerCase();
  }

  async resolveCompany(host: string): Promise<WebsiteContext> {
    const domain = this.normalizeDomain(host);

    const company = await this.getWebsiteCompany(domain);

    if (!company) {
      throw new NotFoundException('Sitio web no encontrado.');
    }

    if (!company.websiteSetting) {
      throw new NotFoundException(
        'La empresa no tiene configurado el sitio web.',
      );
    }

    if (!company.websiteSetting.ecommerceLocalId) {
      throw new NotFoundException(
        'La empresa no tiene configurado el local del ecommerce.',
      );
    }

    const customerId = await this.getConsumidorFinal(company.id);

    const systemUserId = await this.getSystemUser(company.id);

    // Ajustes de tienda por tipo (fulfillment/layout) configurados por la
    // plataforma: la tienda los usa para adaptar entrega y catálogo.
    const typeCfg = company.type
      ? await this.prisma.businessTypeConfig.findUnique({
          where: { type: company.type },
          select: { storefront: true, terminology: true, active: true },
        })
      : null;
    (company as any).typeStorefront =
      typeCfg && typeCfg.active ? (typeCfg.storefront ?? null) : null;
    // Vocabulario del tipo: la tienda lo usa para nombrar producto/pedido/menú.
    (company as any).typeTerminology =
      typeCfg && typeCfg.active ? (typeCfg.terminology ?? null) : null;

    return {
      companyId: company.id,
      localId: company.websiteSetting.ecommerceLocalId,
      customerId,
      systemUserId,
      domain,
      company,
      settings: company.websiteSetting,
      banners: company.websiteBanners,
    };
  }

  /* ==========================================================
     ADMINISTRACIÓN DEL SITIO (desde el CRM)
     Cada empresa configura SU tienda; la plataforma puede
     configurar la de cualquiera pasando ?companyId=.
     ========================================================== */

  private resolveCompanyId(user: any, companyId?: number) {
    const isPlatform = user?.role === Role.SUPER_PLATFORM_ADMIN;

    const target = isPlatform && companyId ? Number(companyId) : user?.companyId;

    if (!target) {
      throw new ForbiddenException('No autorizado');
    }

    return { companyId: target, isPlatform };
  }

  /** Configuración editable del sitio (para el formulario del CRM). */
  async getAdminConfig(user: any, companyId?: number) {
    const { companyId: id } = this.resolveCompanyId(user, companyId);

    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        // Se devuelven para que el CRM muestre de dónde saldrán los datos de
        // contacto si la tienda no define los suyos.
        phone: true,
        email: true,
        domain: true,
        websiteEnabled: true,
        websiteName: true,
        favicon: true,
        theme: true,
        fontFamily: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        ctaColor: true,
        heroTitle: true,
        heroSubtitle: true,
        websiteSetting: true,
        websiteBanners: { orderBy: { order: 'asc' } },
        locals: {
          where: { status: Status.ACTIVO },
          select: { id: true, name: true, address: true, city: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    return company;
  }

  async updateConfig(user: any, dto: UpdateWebsiteDto, companyId?: number) {
    const { companyId: id, isPlatform } = this.resolveCompanyId(
      user,
      companyId,
    );

    // La tienda online requiere plan Altura o superior (la plataforma no se
    // restringe).
    if (!isPlatform) {
      await this.planLimits.assertModule(id, 'website');
    }

    const {
      // Solo la plataforma toca dominio y publicación: son infraestructura.
      domain,
      websiteEnabled,
      // Ajustes del sitio (tabla aparte).
      facebook,
      instagram,
      whatsapp,
      youtube,
      tiktok,
      address,
      schedule,
      footerText,
      metaTitle,
      metaDescription,
      ecommerceLocalId,
      // El resto son campos de la empresa (identidad y diseño).
      ...companyFields
    } = dto;

    if (ecommerceLocalId !== undefined) {
      const local = await this.prisma.local.findFirst({
        where: { id: ecommerceLocalId, companyId: id },
      });

      if (!local) {
        throw new NotFoundException('La sede indicada no existe.');
      }
    }

    if (domain !== undefined || websiteEnabled !== undefined) {
      if (!isPlatform) {
        throw new ForbiddenException(
          'El dominio y la publicación del sitio los gestiona la plataforma.',
        );
      }
    }

    const normalizedDomain =
      domain === undefined
        ? undefined
        : domain
          ? this.normalizeDomain(domain)
          : null;

    if (normalizedDomain) {
      const taken = await this.prisma.company.findFirst({
        where: { domain: normalizedDomain, NOT: { id } },
        select: { id: true },
      });

      if (taken) {
        throw new ConflictException('Ese dominio ya está en uso.');
      }
    }

    const settingsData = {
      facebook,
      instagram,
      whatsapp,
      youtube,
      tiktok,
      address,
      schedule,
      footerText,
      metaTitle,
      metaDescription,
      ecommerceLocalId,
    };

    const hasSettings = Object.values(settingsData).some(
      (value) => value !== undefined,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: {
          ...companyFields,
          ...(normalizedDomain !== undefined ? { domain: normalizedDomain } : {}),
          ...(websiteEnabled !== undefined ? { websiteEnabled } : {}),
        },
      });

      if (hasSettings) {
        await tx.websiteSetting.upsert({
          where: { companyId: id },
          update: settingsData,
          create: { companyId: id, ...settingsData },
        });
      }

      return { success: true };
    });
  }

  /** Sube una imagen del sitio a Cloudinary, separada por empresa. */
  async uploadImage(
    user: any,
    file: Express.Multer.File,
    companyId?: number,
  ) {
    const { companyId: id } = this.resolveCompanyId(user, companyId);

    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen.');
    }

    const { url, publicId } = await this.cloudinary.uploadImage(
      file,
      `website/${id}`,
    );

    return { url, publicId };
  }

  /* ---------- Banners ---------- */

  async createBanner(
    user: any,
    dto: CreateWebsiteBannerDto,
    companyId?: number,
  ) {
    const { companyId: id } = this.resolveCompanyId(user, companyId);

    return this.prisma.websiteBanner.create({
      data: { ...dto, companyId: id },
    });
  }

  async updateBanner(
    user: any,
    bannerId: number,
    dto: UpdateWebsiteBannerDto,
    companyId?: number,
  ) {
    const { companyId: id } = this.resolveCompanyId(user, companyId);

    const banner = await this.prisma.websiteBanner.findFirst({
      where: { id: bannerId, companyId: id },
    });

    if (!banner) {
      throw new NotFoundException('Banner no encontrado.');
    }

    return this.prisma.websiteBanner.update({
      where: { id: bannerId },
      data: dto,
    });
  }

  async removeBanner(user: any, bannerId: number, companyId?: number) {
    const { companyId: id } = this.resolveCompanyId(user, companyId);

    const banner = await this.prisma.websiteBanner.findFirst({
      where: { id: bannerId, companyId: id },
    });

    if (!banner) {
      throw new NotFoundException('Banner no encontrado.');
    }

    await this.prisma.websiteBanner.delete({ where: { id: bannerId } });

    return { success: true };
  }

  private async getWebsiteCompany(domain: string) {
    return this.prisma.company.findFirst({
      where: {
        domain,
        websiteEnabled: true,
        status: 'ACTIVO',
      },
      include: {
        websiteSetting: {
          include: {
            ecommerceLocal: true,
          },
        },

        websiteBanners: {
          where: {
            active: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  private async getConsumidorFinal(companyId: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        companyId,
        name: {
          equals: 'CONSUMIDOR FINAL',
          mode: 'insensitive',
        },
      },
    });

    // No se lanza error: el catálogo debe funcionar aunque falte. El checkout
    // (createOrder) crea el "Consumidor Final" si hace falta.
    return customer?.id ?? null;
  }

  private async getSystemUser(companyId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        companyId,
        status: 'ACTIVO',
        role: 'SUPER_ADMIN',
      },
    });

    if (!user) {
      // No se lanza error: el catálogo no depende de esto. El checkout resuelve
      // el usuario del sistema.
      return null;
    }

    return user.id;
  }
}
