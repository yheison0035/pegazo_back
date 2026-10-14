-- PARQUEADERO: tablas de configuración, tipos de vehículo y tickets de parqueo.
-- Correr en Railway (psql $DATABASE_URL) ANTES de desplegar el backend.
CREATE TABLE IF NOT EXISTS "ParkingSettings" (
  "id"            SERIAL PRIMARY KEY,
  "companyId"     INTEGER NOT NULL UNIQUE,
  "graceMinutes"  INTEGER NOT NULL DEFAULT 0,
  "roundUpToHour" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ParkingVehicleType" (
  "id"         SERIAL PRIMARY KEY,
  "companyId"  INTEGER NOT NULL,
  "name"       TEXT NOT NULL,
  "hourRate"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dayMax"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monthRate"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "capacity"   INTEGER NOT NULL DEFAULT 0,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ParkingVehicleType_companyId_idx" ON "ParkingVehicleType"("companyId");

CREATE TABLE IF NOT EXISTS "ParkingTicket" (
  "id"              SERIAL PRIMARY KEY,
  "companyId"       INTEGER NOT NULL,
  "localId"         INTEGER NOT NULL,
  "code"            TEXT NOT NULL,
  "plate"           TEXT,
  "vehicleTypeId"   INTEGER,
  "vehicleTypeName" TEXT,
  "customerName"    TEXT,
  "customerPhone"   TEXT,
  "customerId"      INTEGER,
  "checkInAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkOutAt"      TIMESTAMP(3),
  "status"          TEXT NOT NULL DEFAULT 'DENTRO',
  "isMonthly"       BOOLEAN NOT NULL DEFAULT false,
  "notes"           TEXT,
  "amount"          DOUBLE PRECISION,
  "saleId"          INTEGER,
  "userId"          INTEGER,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ParkingTicket_companyId_idx" ON "ParkingTicket"("companyId");
CREATE INDEX IF NOT EXISTS "ParkingTicket_localId_idx" ON "ParkingTicket"("localId");
CREATE INDEX IF NOT EXISTS "ParkingTicket_status_idx" ON "ParkingTicket"("status");
