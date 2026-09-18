-- ============================================================================
-- Contenido de productos · AURICULARES + CABLES (formato Mercado Libre)
-- Nombre estandarizado solo con marca/modelo claro; descripción + características
-- (InventoryFeature) + especificaciones (InventorySpecification). Idempotente.
-- ============================================================================

-- ══════════════════════════ AURICULARES ══════════════════════════

-- id 292 · AIRPODS ANC TWS → Audífonos TWS ANC (clon, sin afirmar marca Apple)
UPDATE "Inventory" SET
  name = 'AUDIFONOS INALAMBRICOS TWS ANC',
  description = '<p>Sonido sin cables y sin ruido de fondo. Estos <strong>audífonos inalámbricos TWS</strong> con cancelación de ruido (ANC) se conectan por Bluetooth a tu celular para música y llamadas con manos libres. Incluyen estuche de carga para que los uses todo el día.</p>'
WHERE id = 292;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 292;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Cancelación de ruido (ANC) para escuchar mejor', 292, 0, true, now()),
 ('Conexión Bluetooth con emparejamiento automático', 292, 1, true, now()),
 ('Micrófono para llamadas con manos libres', 292, 2, true, now()),
 ('Estuche de carga portátil incluido', 292, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 292;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo', 'In-ear TWS (inalámbricos)', 292, 0, true, now()),
 ('Conexión', 'Bluetooth', 292, 1, true, now()),
 ('Funciones', 'Música, llamadas, ANC', 292, 2, true, now()),
 ('Carga', 'Estuche recargable por USB', 292, 3, true, now());

-- id 454 · AIRPODS XOQ5 → Audífonos Inalámbricos XO Q5 TWS
UPDATE "Inventory" SET
  name = 'AUDIFONOS INALAMBRICOS XO Q5 TWS',
  description = '<p>Los <strong>audífonos XO Q5</strong> son unos TWS livianos y cómodos, ideales para el día a día. Se conectan por Bluetooth a tu celular para escuchar música y contestar llamadas sin cables, con su estuche de carga siempre a la mano.</p>'
WHERE id = 454;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 454;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseño liviano y cómodo tipo TWS', 454, 0, true, now()),
 ('Conexión Bluetooth estable', 454, 1, true, now()),
 ('Micrófono integrado para llamadas', 454, 2, true, now()),
 ('Estuche de carga incluido', 454, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 454;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'XO Q5', 454, 0, true, now()),
 ('Tipo', 'In-ear TWS', 454, 1, true, now()),
 ('Conexión', 'Bluetooth', 454, 2, true, now()),
 ('Carga', 'Estuche recargable por USB', 454, 3, true, now());

-- id 455 · AIRPODS XOQ7 → Audífonos Inalámbricos XO Q7 TWS
UPDATE "Inventory" SET
  name = 'AUDIFONOS INALAMBRICOS XO Q7 TWS',
  description = '<p>Los <strong>audífonos XO Q7</strong> te dan sonido inalámbrico claro y buena autonomía. Perfectos para música, videos y llamadas desde tu celular, con estuche de carga compacto para llevar a todas partes.</p>'
WHERE id = 455;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 455;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sonido inalámbrico claro para música y videos', 455, 0, true, now()),
 ('Conexión Bluetooth con emparejamiento rápido', 455, 1, true, now()),
 ('Micrófono para llamadas manos libres', 455, 2, true, now()),
 ('Estuche de carga compacto incluido', 455, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 455;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'XO Q7', 455, 0, true, now()),
 ('Tipo', 'In-ear TWS', 455, 1, true, now()),
 ('Conexión', 'Bluetooth', 455, 2, true, now()),
 ('Carga', 'Estuche recargable por USB', 455, 3, true, now());

-- id 297 · AUDIFONO CON CABLE JOYROOM JR-EP3
UPDATE "Inventory" SET
  name = 'AUDIFONOS CON CABLE JOYROOM JR-EP3',
  description = '<p>Los <strong>audífonos Joyroom JR-EP3</strong> son manos libres con cable, cómodos y con buen sonido para música y llamadas. Traen control en línea y micrófono, listos para conectar y usar en tu celular.</p>'
WHERE id = 297;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 297;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sonido estéreo para música y llamadas', 297, 0, true, now()),
 ('Control en línea con micrófono', 297, 1, true, now()),
 ('Diseño cómodo tipo in-ear', 297, 2, true, now()),
 ('Plug and play: conectar y usar', 297, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 297;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'Joyroom JR-EP3', 297, 0, true, now()),
 ('Tipo', 'In-ear con cable', 297, 1, true, now()),
 ('Control', 'En línea con micrófono', 297, 2, true, now());

-- id 298 · AUDIFONOS CON CABLE MOXOM TIPO C
UPDATE "Inventory" SET
  name = 'AUDIFONOS CON CABLE MOXOM CONECTOR TIPO C',
  description = '<p>Audífonos <strong>Moxom con conector Tipo C</strong>, ideales para celulares que ya no traen entrada de 3.5 mm. Sonido claro para música y llamadas, con micrófono y control en línea. Solo conéctalos al puerto Tipo C y listo.</p>'
WHERE id = 298;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 298;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Conector Tipo C directo (sin adaptadores)', 298, 0, true, now()),
 ('Sonido claro para música y llamadas', 298, 1, true, now()),
 ('Micrófono y control en línea', 298, 2, true, now()),
 ('Compatibles con celulares con puerto Tipo C', 298, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 298;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca', 'Moxom', 298, 0, true, now()),
 ('Conector', 'USB Tipo C', 298, 1, true, now()),
 ('Tipo', 'In-ear con cable', 298, 2, true, now());

-- id 296 · AUDIFONOS INALAMBRICOS EARPHONES → genérico TWS
UPDATE "Inventory" SET
  name = 'AUDIFONOS INALAMBRICOS TWS',
  description = '<p><strong>Audífonos inalámbricos TWS</strong> para disfrutar tu música sin cables. Se conectan por Bluetooth a tu celular y traen micrófono para llamadas manos libres. Incluyen estuche de carga para tenerlos siempre listos.</p>'
WHERE id = 296;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 296;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Totalmente inalámbricos (TWS)', 296, 0, true, now()),
 ('Conexión Bluetooth con tu celular', 296, 1, true, now()),
 ('Micrófono para llamadas manos libres', 296, 2, true, now()),
 ('Estuche de carga incluido', 296, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 296;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo', 'In-ear TWS', 296, 0, true, now()),
 ('Conexión', 'Bluetooth', 296, 1, true, now()),
 ('Carga', 'Estuche recargable por USB', 296, 2, true, now());

-- id 299 · AUDIFONOS STEREO G27
UPDATE "Inventory" SET
  name = 'AUDIFONOS ESTEREO G27',
  description = '<p>Los <strong>audífonos estéreo G27</strong> ofrecen buen sonido con bajos definidos para música, videos y juegos. Manos libres con micrófono, cómodos y prácticos para el uso diario con tu celular.</p>'
WHERE id = 299;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 299;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sonido estéreo con buenos bajos', 299, 0, true, now()),
 ('Micrófono para llamadas manos libres', 299, 1, true, now()),
 ('Diseño cómodo para uso diario', 299, 2, true, now()),
 ('Compatibles con celular y otros dispositivos', 299, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 299;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo', 'G27', 299, 0, true, now()),
 ('Tipo', 'In-ear con cable', 299, 1, true, now()),
 ('Control', 'Micrófono integrado', 299, 2, true, now());

-- id 450 · AURICULARES BASE MOXOM WL54 → con base de carga
UPDATE "Inventory" SET
  name = 'AURICULARES INALAMBRICOS MOXOM WL54 CON BASE DE CARGA',
  description = '<p>Los <strong>auriculares Moxom WL54</strong> son inalámbricos con base de carga, así siempre los tienes cargados y a la mano. Sonido claro por Bluetooth para música y llamadas, cómodos y fáciles de usar.</p>'
WHERE id = 450;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 450;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Base de carga para tenerlos siempre listos', 450, 0, true, now()),
 ('Conexión Bluetooth con tu celular', 450, 1, true, now()),
 ('Micrófono para llamadas manos libres', 450, 2, true, now()),
 ('Diseño cómodo y liviano', 450, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 450;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'Moxom WL54', 450, 0, true, now()),
 ('Conexión', 'Bluetooth', 450, 1, true, now()),
 ('Carga', 'Base recargable', 450, 2, true, now());

-- id 301 · AURICULARES BLUETOOTH LANGSDOM
UPDATE "Inventory" SET
  name = 'AURICULARES BLUETOOTH LANGSDOM',
  description = '<p>Los <strong>auriculares Bluetooth Langsdom</strong> te dan sonido inalámbrico con buena autonomía para música y llamadas. Prácticos y cómodos, se conectan fácil a tu celular para acompañarte todo el día.</p>'
WHERE id = 301;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 301;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sonido inalámbrico por Bluetooth', 301, 0, true, now()),
 ('Buena autonomía para el día a día', 301, 1, true, now()),
 ('Micrófono para llamadas manos libres', 301, 2, true, now()),
 ('Diseño cómodo y práctico', 301, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 301;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca', 'Langsdom', 301, 0, true, now()),
 ('Conexión', 'Bluetooth', 301, 1, true, now()),
 ('Tipo', 'In-ear inalámbricos', 301, 2, true, now());

-- id 294 · AURICULARES CONECTOR LIGHTNING
UPDATE "Inventory" SET
  name = 'AUDIFONOS CON CONECTOR LIGHTNING',
  description = '<p><strong>Audífonos con conector Lightning</strong>, ideales para iPhone que no traen entrada de 3.5 mm. Sonido claro para música y llamadas, con micrófono y control en línea. Solo conéctalos al puerto Lightning y listo.</p>'
WHERE id = 294;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 294;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Conector Lightning directo para iPhone', 294, 0, true, now()),
 ('Sonido claro para música y llamadas', 294, 1, true, now()),
 ('Micrófono y control en línea', 294, 2, true, now()),
 ('Sin necesidad de adaptadores', 294, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 294;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conector', 'Lightning', 294, 0, true, now()),
 ('Tipo', 'In-ear con cable', 294, 1, true, now()),
 ('Control', 'En línea con micrófono', 294, 2, true, now());

-- id 289 · AURICULARES INALAMBRICOS CON BANDA CUELLO MX-WL54
UPDATE "Inventory" SET
  name = 'AUDIFONOS INALAMBRICOS DE CUELLO MOXOM MX-WL54',
  description = '<p>Los <strong>audífonos de cuello Moxom MX-WL54</strong> son inalámbricos con banda para el cuello, cómodos para hacer deporte o usar todo el día. Se conectan por Bluetooth y traen micrófono para llamadas manos libres.</p>'
WHERE id = 289;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 289;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Banda para el cuello: cómodos y seguros', 289, 0, true, now()),
 ('Conexión Bluetooth con tu celular', 289, 1, true, now()),
 ('Ideales para deporte y uso diario', 289, 2, true, now()),
 ('Micrófono para llamadas manos libres', 289, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 289;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'Moxom MX-WL54', 289, 0, true, now()),
 ('Tipo', 'De cuello inalámbricos', 289, 1, true, now()),
 ('Conexión', 'Bluetooth', 289, 2, true, now());

-- (id 449 eliminado: era duplicado de id 297 AUDIFONOS CON CABLE JOYROOM JR-EP3)

-- id 451 · AURICULARES MOXOM EP801
UPDATE "Inventory" SET
  name = 'AUDIFONOS CON CABLE MOXOM EP801',
  description = '<p>Los <strong>audífonos Moxom EP801</strong> ofrecen sonido claro y cómodo para tu día a día. Manos libres con micrófono y control en línea, ideales para música, videos y llamadas desde tu celular.</p>'
WHERE id = 451;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 451;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sonido claro para música y llamadas', 451, 0, true, now()),
 ('Micrófono y control en línea', 451, 1, true, now()),
 ('Diseño cómodo tipo in-ear', 451, 2, true, now()),
 ('Compatibles con celular y otros dispositivos', 451, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 451;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'Moxom EP801', 451, 0, true, now()),
 ('Tipo', 'In-ear con cable', 451, 1, true, now()),
 ('Control', 'En línea con micrófono', 451, 2, true, now());

-- ══════════════════════════ CABLES ══════════════════════════

-- id 293 · CABLE CARGA RAPIDA LDNIO
UPDATE "Inventory" SET
  name = 'CABLE DE CARGA RAPIDA LDNIO',
  description = '<p>Carga tu celular más rápido y sin enredos con el <strong>cable de carga rápida LDNIO</strong>. Fabricado para soportar el uso diario, transmite energía y datos de forma estable. Ideal para tener en casa, la oficina o el carro.</p>'
WHERE id = 293;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 293;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Soporta carga rápida', 293, 0, true, now()),
 ('Transmite energía y datos', 293, 1, true, now()),
 ('Material resistente al uso diario', 293, 2, true, now()),
 ('Marca LDNIO', 293, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 293;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca', 'LDNIO', 293, 0, true, now()),
 ('Función', 'Carga rápida + datos', 293, 1, true, now());

-- id 281 · CABLE LIGHTNING TO USB IPHONE
UPDATE "Inventory" SET
  name = 'CABLE USB A LIGHTNING PARA IPHONE',
  description = '<p><strong>Cable USB a Lightning</strong> para cargar y sincronizar tu iPhone. Transmite energía y datos de forma estable, con conectores reforzados para durar más. Ideal como cable de repuesto o para tener uno extra.</p>'
WHERE id = 281;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 281;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Carga y sincroniza tu iPhone', 281, 0, true, now()),
 ('Conectores reforzados de larga duración', 281, 1, true, now()),
 ('Transmite energía y datos', 281, 2, true, now()),
 ('Ideal como cable de repuesto', 281, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 281;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conectores', 'USB-A a Lightning', 281, 0, true, now()),
 ('Compatibilidad', 'iPhone', 281, 1, true, now()),
 ('Función', 'Carga + datos', 281, 2, true, now());

-- id 460 · CABLE LS631 (LDNIO)
UPDATE "Inventory" SET
  name = 'CABLE DE CARGA RAPIDA LDNIO LS631',
  description = '<p>El <strong>cable LDNIO LS631</strong> es un cable de carga rápida resistente y confiable para tu día a día. Transmite energía y datos de forma estable, ideal para cargar tu celular en casa, la oficina o de viaje.</p>'
WHERE id = 460;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 460;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Soporta carga rápida', 460, 0, true, now()),
 ('Material resistente y flexible', 460, 1, true, now()),
 ('Transmite energía y datos', 460, 2, true, now()),
 ('Modelo LDNIO LS631', 460, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 460;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo', 'LDNIO LS631', 460, 0, true, now()),
 ('Función', 'Carga rápida + datos', 460, 1, true, now());

-- id 285 · CABLES USB A TIPO C ALUMINUM
UPDATE "Inventory" SET
  name = 'CABLE USB A TIPO C CARCASA ALUMINIO',
  description = '<p><strong>Cable USB a Tipo C</strong> con conectores en aluminio, más resistentes y duraderos. Soporta carga rápida y transferencia de datos para tu celular o dispositivos con puerto Tipo C. Un cable firme para el uso de todos los días.</p>'
WHERE id = 285;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 285;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Conectores en aluminio de larga duración', 285, 0, true, now()),
 ('Soporta carga rápida', 285, 1, true, now()),
 ('Transfiere datos', 285, 2, true, now()),
 ('Compatible con dispositivos Tipo C', 285, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 285;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conectores', 'USB-A a Tipo C', 285, 0, true, now()),
 ('Material', 'Aluminio', 285, 1, true, now()),
 ('Función', 'Carga rápida + datos', 285, 2, true, now());

-- id 282 · CABLE TIPO C A TIPO C (1M)
UPDATE "Inventory" SET
  name = 'CABLE TIPO C A TIPO C 1 METRO',
  description = '<p><strong>Cable Tipo C a Tipo C de 1 metro</strong> para cargar y sincronizar celulares, tablets y portátiles con puerto USB-C. Soporta carga rápida y transferencia de datos, con la longitud justa para usar cómodamente.</p>'
WHERE id = 282;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 282;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Doble Tipo C para dispositivos modernos', 282, 0, true, now()),
 ('Soporta carga rápida', 282, 1, true, now()),
 ('Transfiere datos', 282, 2, true, now()),
 ('Longitud de 1 metro', 282, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 282;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conectores', 'Tipo C a Tipo C', 282, 0, true, now()),
 ('Longitud', '1 metro', 282, 1, true, now()),
 ('Función', 'Carga rápida + datos', 282, 2, true, now());

-- (id 465 eliminado: era duplicado de id 282 CABLE TIPO C A TIPO C 1 METRO)

-- id 463 · CABLE TIPO C TIPO C 2 EN 1
UPDATE "Inventory" SET
  name = 'CABLE TIPO C 2 EN 1',
  description = '<p><strong>Cable Tipo C 2 en 1</strong>: carga varios dispositivos con un solo cable gracias a sus conectores combinados. Soporta carga rápida y transferencia de datos, práctico para llevar menos cables encima.</p>'
WHERE id = 463;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 463;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: carga varios dispositivos', 463, 0, true, now()),
 ('Soporta carga rápida', 463, 1, true, now()),
 ('Transfiere datos', 463, 2, true, now()),
 ('Práctico para viajar con menos cables', 463, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 463;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo', 'Cable 2 en 1', 463, 0, true, now()),
 ('Conector principal', 'USB Tipo C', 463, 1, true, now()),
 ('Función', 'Carga rápida + datos', 463, 2, true, now());

-- id 279 · CABLE TIPO C TIPO C MYTECHCELL
UPDATE "Inventory" SET
  name = 'CABLE TIPO C A TIPO C MYTECHCELL',
  description = '<p><strong>Cable Tipo C a Tipo C MyTechCell</strong> para cargar y sincronizar tus dispositivos con puerto USB-C. Soporta carga rápida y datos, con acabado resistente para el uso de todos los días.</p>'
WHERE id = 279;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 279;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Doble Tipo C para dispositivos modernos', 279, 0, true, now()),
 ('Soporta carga rápida', 279, 1, true, now()),
 ('Transfiere datos', 279, 2, true, now()),
 ('Acabado resistente MyTechCell', 279, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 279;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca', 'MyTechCell', 279, 0, true, now()),
 ('Conectores', 'Tipo C a Tipo C', 279, 1, true, now()),
 ('Función', 'Carga rápida + datos', 279, 2, true, now());

-- id 291 · CABLE USB A IPHONE 1000MM
UPDATE "Inventory" SET
  name = 'CABLE USB A LIGHTNING PARA IPHONE 1 METRO',
  description = '<p><strong>Cable USB a Lightning de 1 metro</strong> para cargar y sincronizar tu iPhone. Transmite energía y datos de forma estable, con la longitud ideal para usar cómodamente en casa o el trabajo.</p>'
WHERE id = 291;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 291;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Carga y sincroniza tu iPhone', 291, 0, true, now()),
 ('Longitud de 1 metro', 291, 1, true, now()),
 ('Transmite energía y datos', 291, 2, true, now()),
 ('Ideal como cable de repuesto', 291, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 291;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conectores', 'USB-A a Lightning', 291, 0, true, now()),
 ('Longitud', '1 metro', 291, 1, true, now()),
 ('Compatibilidad', 'iPhone', 291, 2, true, now());

-- (id 464 eliminado: era duplicado de id 281 CABLE USB A LIGHTNING PARA IPHONE)
