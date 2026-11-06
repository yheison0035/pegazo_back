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

## Aislamiento por local (multi-sede)

`getAccessibleLocalIds(prisma, user)` decide qué locales ve cada usuario: el dueño
(`SUPER_ADMIN`) y los roles globales (`COORDINADOR`, `AUXILIAR`) ven todos los de
su empresa (`null`); un `ADMIN` ve **exclusivamente el local que tiene asignado**
(`user.localId`) y nunca otro, aunque figure como manager de otras sedes (solo si
no tiene local asignado cae a los que administra, por compatibilidad); los demás
roles, su local asignado. `assertLocalAccess(prisma, user, localId)` es la
contraparte para UN registro (lanza 403 si el usuario no puede acceder a ese
local; para roles globales verifica que el local sea de su empresa, evitando
fugas entre empresas). Para listados se usa `applyLocalFilter` o un `where.localId
in <accesibles>`; el dueño puede acotar con `?localId`.

Este aislamiento se aplica en TODOS los módulos con datos por local: caja,
ventas, pedidos web (source=ECOMMERCE, por el local del sitio), inventario,
citas, gastos, compras, cotizaciones, cuentas por pagar, devoluciones,
membresías, parqueadero, comandas, mesas, solicitudes de stock (por el
`inventory.localId`), cobros a empleados (por el local del empleado) y clientes
(separados por su local de registro). Los catálogos/config compartidos
(categorías, marcas, proveedores, unidades, medios de pago, cupones, recetas,
segmentos, banco, plan de cuentas y asientos contables, config de parqueadero)
siguen siendo company-wide por diseño.

Specs: `access-locals.util.spec.ts` (la decisión), más specs de aislamiento
representativos por lote: `purchases.isolation`, `services.isolation`,
`appointments.findone`, `mesas.isolation`, `employee-charges.isolation`,
`customers.isolation`, y `cash.service.spec` (acceso denegado a otro local).

## Caja: ingresos por ventas, salidas por gastos

La caja ya no tiene movimientos manuales de efectivo. Los INGRESOS entran por las
ventas en efectivo (reconciliación automática) y las SALIDAS son los GASTOS en
efectivo del día registrados en el módulo Gastos. `CashService.sumCashExpenses`
suma los gastos `EFECTIVO`, de la sede, no eliminados, dentro de la ventana de la
caja (por `createdAt`), y `computeTotals` resta esos `gastos` del esperado
(`base + ventas − gastos`). Spec: `cash.service.spec.ts` (el esperado resta los
gastos; el filtro es EFECTIVO + sede + no eliminados; sin gastos el esperado es
base + ventas).
