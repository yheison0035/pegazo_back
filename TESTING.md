# Pruebas — reglas del proyecto

Un módulo **no está terminado** hasta que:

1. Su lógica pura tiene **tests unitarios** (`*.spec.ts` junto al archivo).
2. Su servicio tiene tests con **Prisma simulado** (sin base de datos) — plantilla: `src/common/plan-limits.service.spec.ts`.
3. Si toca **dinero, stock o datos del cliente**, tiene al menos un test de integración o de punta a punta.
4. Se probó con **al menos 3 tipos de negocio** (retail, por peso, servicios/citas; comida si aplica).
5. **CI en verde** (`.github/workflows/ci.yml` corre tests + build en cada push/PR).

## Comandos

- `npm test` — corre todo.
- `npm run test:watch` — en desarrollo.
- `npm run test:cov` — cobertura (carpeta `coverage/`).
- `npm run test:ci` — como en CI.

## Cómo simular Prisma

```ts
const prisma = { company: { findUnique: jest.fn() } };
const mod = await Test.createTestingModule({
  providers: [MiServicio, { provide: PrismaService, useValue: prisma }],
}).compile();
```

Importa con alias `@/...` (ya mapeado en Jest). Los `*.spec.ts` quedan fuera del build (`tsconfig.build.json`).

## Horario de atención por día (citas)

El horario del negocio se maneja por día de la semana y de él depende la
disponibilidad de citas. `AppointmentsService.resolveBusinessHours` es la fuente
única del horario efectivo por fecha (lee `bookingConfig.weekHours`, clave
0=Dom..6=Sáb, y cae al rango general `openHour`/`closeHour`); la usan tanto
`getAvailability` como `publicBook`. Specs:

- `appointments.availability.spec.ts` — disponibilidad por día (día cerrado sin
  franjas, respeta el horario propio del día, cae al rango general) y
  `resolveBusinessHours` directamente (fuente compartida).
- `companies.hours.spec.ts` — `updateHours` sanea y guarda `weekHours` sin pisar
  el resto de `bookingConfig` y sincroniza `openHour`/`closeHour` de respaldo.
