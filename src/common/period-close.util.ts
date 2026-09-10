import { BadRequestException } from '@nestjs/common';

// Cierre de periodo: si la empresa tiene libros cerrados hasta cierta fecha,
// no se permite crear ni editar movimientos (ventas/gastos) con fecha ≤ esa.
// El dueño fija/reabre la fecha en Configuración.
export async function assertPeriodOpen(
  prisma: { company: { findUnique: Function } },
  companyId: number,
  date: Date | string | undefined | null,
) {
  if (!companyId || !date) return;
  const c = await prisma.company.findUnique({
    where: { id: companyId },
    select: { booksClosedUntil: true },
  });
  const closed = c?.booksClosedUntil;
  if (closed && new Date(date) <= new Date(closed)) {
    const d = new Date(closed).toLocaleDateString('es-CO');
    throw new BadRequestException(
      `El periodo está cerrado hasta el ${d}. No se pueden registrar ni editar movimientos en fechas cerradas.`,
    );
  }
}
