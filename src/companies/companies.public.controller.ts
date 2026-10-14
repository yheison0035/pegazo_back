import { Controller, Get } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { CompaniesService } from './companies.service';

// Clientes para la landing (público): nombre + logo de las empresas registradas.
@Controller('public/clients')
export class PublicClientsController {
  constructor(private readonly service: CompaniesService) {}

  @Public()
  @Get()
  list() {
    return this.service.publicClients();
  }
}
