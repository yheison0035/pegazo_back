import { Controller, Get } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { BusinessTypesService } from './business-types.service';

// Lista pública de tipos de negocio (para la landing). Dinámica: muestra los
// tipos ACTIVOS con el modo de su página pública; un tipo nuevo aparece solo.
@Controller('public/business-types')
export class PublicBusinessTypesController {
  constructor(private readonly service: BusinessTypesService) {}

  @Public()
  @Get()
  list() {
    return this.service.publicList();
  }
}
