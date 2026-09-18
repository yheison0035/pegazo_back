-- ============================================================================
-- Contenido de productos · Categoría STREAMING Y PROYECTORES (PILOTO)
-- Nombre estandarizado (solo con modelo/marca claro), descripción,
-- características (InventoryFeature) y especificaciones (InventorySpecification).
-- Idempotente: reemplaza características y especificaciones de cada producto.
-- Las especificaciones son típicas del producto; confirma contra tu stock.
-- ============================================================================

-- ── id 75 · M15 PLUS → Consola Retro Game Stick Pro M15 Plus 4K ────────────
UPDATE "Inventory" SET
  name = 'CONSOLA RETRO GAME STICK PRO M15 PLUS 4K',
  description = '<p>Revive los videojuegos clásicos en tu televisor. La <strong>consola Game Stick Pro M15 Plus</strong> se conecta al puerto HDMI de tu TV y trae miles de juegos retro listos para jugar. Incluye <strong>2 controles inalámbricos</strong> para jugar en pareja o en familia, con salida de video hasta 4K y soporte para juegos 3D. Plug and play: conéctala y empieza a jugar sin instalar nada.</p><p><strong>Contenido del paquete:</strong> consola Game Stick, 2 controles inalámbricos, cable HDMI, receptor USB y manual.</p>'
WHERE id = 75;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 75;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Miles de juegos retro listos para jugar', 75, 0, true, now()),
 ('Incluye 2 controles inalámbricos (2.4G) para 2 jugadores', 75, 1, true, now()),
 ('Salida de video hasta 4K y soporte para juegos 3D', 75, 2, true, now()),
 ('Se conecta al HDMI del televisor', 75, 3, true, now()),
 ('Plug and play: sin instalaciones ni descargas', 75, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 75;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo', 'M15 Plus (Game Stick Pro)', 75, 0, true, now()),
 ('Conexión', 'HDMI', 75, 1, true, now()),
 ('Controles', '2 inalámbricos (2.4G)', 75, 2, true, now()),
 ('Salida de video', 'Hasta 4K', 75, 3, true, now()),
 ('Alimentación', 'USB', 75, 4, true, now()),
 ('Contenido del paquete', 'Consola + 2 controles + cable HDMI + receptor USB', 75, 5, true, now());

-- ── id 106 · CAMARA V380 PRO WIFI → Cámara de Seguridad WiFi V380 Pro ───────
UPDATE "Inventory" SET
  name = 'CAMARA DE SEGURIDAD WIFI V380 PRO',
  description = '<p>Cuida tu casa o negocio desde tu celular. La <strong>Cámara de Seguridad WiFi V380 Pro</strong> te deja ver en vivo, hablar y escuchar por la app, con visión nocturna y alertas de movimiento. Se conecta a tu WiFi y guarda las grabaciones en memoria microSD.</p>'
WHERE id = 106;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 106;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Ves en vivo desde tu celular con la app V380 Pro', 106, 0, true, now()),
 ('Visión nocturna para vigilar de día y de noche', 106, 1, true, now()),
 ('Audio de dos vías: escucha y habla por la cámara', 106, 2, true, now()),
 ('Alertas de movimiento en tiempo real', 106, 3, true, now()),
 ('Graba en memoria microSD (no incluida)', 106, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 106;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('App', 'V380 Pro (Android / iOS)', 106, 0, true, now()),
 ('Conexión', 'WiFi 2.4 GHz', 106, 1, true, now()),
 ('Visión nocturna', 'Sí, por infrarrojo', 106, 2, true, now()),
 ('Audio', 'Micrófono y parlante (dos vías)', 106, 3, true, now()),
 ('Almacenamiento', 'Memoria microSD (no incluida)', 106, 4, true, now());

-- ── id 76 · GAME STICK LITE → Consola Retro Game Stick Lite 4K ──────────────
UPDATE "Inventory" SET
  name = 'CONSOLA RETRO GAME STICK LITE 4K',
  description = '<p>Revive los clásicos con la <strong>Consola Retro Game Stick Lite</strong>. Se conecta al HDMI de tu TV y trae miles de juegos listos para jugar, con dos controles inalámbricos para disfrutar en pareja o familia. Plug and play: conéctala y a jugar.</p>'
WHERE id = 76;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 76;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Miles de juegos retro listos para jugar', 76, 0, true, now()),
 ('Dos controles inalámbricos incluidos', 76, 1, true, now()),
 ('Se conecta al HDMI del televisor', 76, 2, true, now()),
 ('Salida de video en alta definición', 76, 3, true, now()),
 ('Plug and play: sin instalaciones', 76, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 76;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conexión', 'HDMI', 76, 0, true, now()),
 ('Controles', '2 inalámbricos', 76, 1, true, now()),
 ('Salida de video', 'HD / 4K compatible', 76, 2, true, now()),
 ('Alimentación', 'USB', 76, 3, true, now()),
 ('Incluye', 'Consola, 2 controles, cables', 76, 4, true, now());

-- ── id 71 · INTERCOMUNICADOR → Intercomunicador Bluetooth para Casco ────────
UPDATE "Inventory" SET
  name = 'INTERCOMUNICADOR BLUETOOTH PARA CASCO DE MOTO',
  description = '<p>Comunícate sin soltar el manubrio. El <strong>Intercomunicador Bluetooth para casco de moto</strong> te permite hablar con tu acompañante o parrillero, contestar llamadas y escuchar música o el GPS con manos libres. Fácil de instalar en cualquier casco.</p>'
WHERE id = 71;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 71;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Habla con tu parrillero mientras conduces', 71, 0, true, now()),
 ('Contesta llamadas con manos libres', 71, 1, true, now()),
 ('Escucha música y GPS por Bluetooth', 71, 2, true, now()),
 ('Resistente a salpicaduras y lluvia', 71, 3, true, now()),
 ('Fácil de instalar en cualquier casco', 71, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 71;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conexión', 'Bluetooth', 71, 0, true, now()),
 ('Uso', 'Casco de motocicleta', 71, 1, true, now()),
 ('Función', 'Intercomunicador + llamadas + música', 71, 2, true, now()),
 ('Resistencia', 'A salpicaduras / lluvia ligera', 71, 3, true, now()),
 ('Batería', 'Recargable por USB', 71, 4, true, now());

-- ── id 415 · ASTRONAUTA FLOTANTE PARLANTE ──────────────────────────────────
UPDATE "Inventory" SET
  description = '<p>Ambiente y música en uno. Este <strong>parlante proyector de astronauta</strong> llena tu techo de estrellas y nebulosas de colores mientras suena tu música por Bluetooth. Perfecto para el cuarto, fiestas o para relajarte, con control remoto y varios modos de luz.</p>'
WHERE id = 415;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 415;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Proyecta galaxia y estrellas de colores', 415, 0, true, now()),
 ('Parlante Bluetooth integrado', 415, 1, true, now()),
 ('Varios modos y colores de luz', 415, 2, true, now()),
 ('Control remoto incluido', 415, 3, true, now()),
 ('Decoración ideal para cuarto y fiestas', 415, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 415;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Función', 'Proyector de galaxia + parlante', 415, 0, true, now()),
 ('Audio', 'Bluetooth', 415, 1, true, now()),
 ('Control', 'Remoto incluido', 415, 2, true, now()),
 ('Alimentación', 'USB', 415, 3, true, now()),
 ('Modos de luz', 'Varios colores y efectos', 415, 4, true, now());

-- ── id 409 · TRIPODE NEEPHO ────────────────────────────────────────────────
UPDATE "Inventory" SET
  description = '<p>Graba y transmite sin que te tiemble el pulso. El <strong>trípode Neepho</strong> sostiene tu celular firme para videos, fotos, videollamadas y transmisiones en vivo. Altura ajustable y control Bluetooth para disparar sin tocar el teléfono.</p>'
WHERE id = 409;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 409;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Sostiene tu celular firme para grabar', 409, 0, true, now()),
 ('Altura y ángulo ajustables', 409, 1, true, now()),
 ('Control Bluetooth para disparar a distancia', 409, 2, true, now()),
 ('Ideal para videos, en vivo y videollamadas', 409, 3, true, now()),
 ('Plegable y fácil de llevar', 409, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 409;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Uso', 'Celular / smartphone', 409, 0, true, now()),
 ('Control', 'Disparador Bluetooth', 409, 1, true, now()),
 ('Altura', 'Ajustable / extensible', 409, 2, true, now()),
 ('Material', 'Aluminio y plástico resistente', 409, 3, true, now());

-- ── id 17 · PROYECTOR GAMES → Proyector Inteligente Game 2 en 1 Android TV ──
UPDATE "Inventory" SET
  name = 'PROYECTOR INTELIGENTE GAME 2 EN 1 ANDROID TV WIFI',
  description = '<p>Cine y videojuegos en una sola pantalla gigante. Este <strong>proyector inteligente 2 en 1</strong> tiene Android TV con WiFi, así que reproduces YouTube, Netflix, Spotify, Prime Video y HBO Max directamente, sin otros aparatos. Además incluye <strong>2 controles inalámbricos</strong> para jugar títulos retro y en 3D. Compatible con imagen hasta 4K: conéctalo por HDMI o USB y convierte tu pared en tu pantalla.</p><p><strong>Contenido del paquete:</strong> proyector, 2 controles inalámbricos y control remoto.</p>'
WHERE id = 17;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 17;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: proyector de cine + consola de juegos', 17, 0, true, now()),
 ('Android TV con apps: YouTube, Netflix, Spotify, Prime Video y HBO Max', 17, 1, true, now()),
 ('Incluye 2 controles inalámbricos para juegos retro y 3D', 17, 2, true, now()),
 ('WiFi integrado y compatible con contenido 4K', 17, 3, true, now()),
 ('Conexión por HDMI, USB y WiFi (celular)', 17, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 17;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Sistema', 'Android TV', 17, 0, true, now()),
 ('Conectividad', 'WiFi + Bluetooth', 17, 1, true, now()),
 ('Compatibilidad de video', 'Hasta 4K', 17, 2, true, now()),
 ('Entradas', 'HDMI, USB', 17, 3, true, now()),
 ('Incluye', '2 controles inalámbricos + control remoto', 17, 4, true, now()),
 ('Fuente de luz', 'LED', 17, 5, true, now());

-- ── id 68 · PROYECTOR HD ───────────────────────────────────────────────────
UPDATE "Inventory" SET
  description = '<p>Disfruta tus películas y series con buena imagen. Este <strong>proyector HD</strong> es una opción sencilla y económica para tener pantalla grande en casa: conéctalo a tu celular, USB o HDMI y proyecta en la pared o telón.</p>'
WHERE id = 68;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 68;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Imagen HD para películas y series', 68, 0, true, now()),
 ('Conexión HDMI, USB y celular', 68, 1, true, now()),
 ('Tamaño de imagen ajustable', 68, 2, true, now()),
 ('Opción económica para cine en casa', 68, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 68;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Entradas', 'HDMI, USB, AV', 68, 0, true, now()),
 ('Fuente de luz', 'LED', 68, 1, true, now()),
 ('Uso recomendado', 'Interior / poca luz', 68, 2, true, now());

-- ── id 14 · PROYECTOR LED ──────────────────────────────────────────────────
UPDATE "Inventory" SET
  description = '<p>Lleva el cine a tu sala. Este <strong>proyector LED</strong> proyecta películas, series y presentaciones en pantalla grande con conexión a celular, USB y HDMI. Práctico, portátil y fácil de usar.</p>'
WHERE id = 14;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 14;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Proyecta películas, series y presentaciones', 14, 0, true, now()),
 ('Conexión con celular, USB y HDMI', 14, 1, true, now()),
 ('Tecnología LED de bajo consumo', 14, 2, true, now()),
 ('Portátil y fácil de usar', 14, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 14;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Entradas', 'HDMI, USB, AV', 14, 0, true, now()),
 ('Fuente de luz', 'LED', 14, 1, true, now()),
 ('Uso recomendado', 'Interior / poca luz', 14, 2, true, now());

-- ── id 74 · GAME TV STICK ──────────────────────────────────────────────────
UPDATE "Inventory" SET
  description = '<p>Los juegos de siempre, en tu televisor. El <strong>Game TV Stick</strong> se conecta al HDMI de tu TV y trae una gran cantidad de juegos retro con controles para jugar en familia. Conéctalo y empieza a jugar.</p>'
WHERE id = 74;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 74;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran cantidad de juegos retro incluidos', 74, 0, true, now()),
 ('Controles para jugar en familia', 74, 1, true, now()),
 ('Se conecta al HDMI del televisor', 74, 2, true, now()),
 ('Plug and play: sin instalaciones', 74, 3, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 74;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conexión', 'HDMI', 74, 0, true, now()),
 ('Controles', 'Incluidos', 74, 1, true, now()),
 ('Alimentación', 'USB', 74, 2, true, now());

-- ── id 73 · WATCH ONN → onn. Dispositivo de Streaming Full HD con Google TV ─
UPDATE "Inventory" SET
  name = 'ONN. DISPOSITIVO DE STREAMING FULL HD CON GOOGLE TV',
  description = '<p>Convierte tu televisor en un Smart TV con Google TV. El <strong>dispositivo de streaming onn.</strong> se conecta al HDMI de tu TV y te da acceso a Netflix, YouTube, Disney+, Prime Video y todas tus apps favoritas en Full HD. Incluye control remoto por voz con Google Assistant (“Hey Google”) y sonido Dolby Audio. Fácil de instalar: conéctalo, enlázalo a tu WiFi y empieza a ver.</p>'
WHERE id = 73;
DELETE FROM "InventoryFeature" WHERE "inventoryId" = 73;
INSERT INTO "InventoryFeature" ("title","inventoryId","order","visible","createdAt") VALUES
 ('Google TV: todas tus apps en un solo lugar', 73, 0, true, now()),
 ('Control remoto por voz con Google Assistant (“Hey Google”)', 73, 1, true, now()),
 ('Resolución Full HD (1080p) con sonido Dolby Audio', 73, 2, true, now()),
 ('Se conecta al puerto HDMI del televisor', 73, 3, true, now()),
 ('Fácil de instalar por WiFi', 73, 4, true, now());
DELETE FROM "InventorySpecification" WHERE "inventoryId" = 73;
INSERT INTO "InventorySpecification" ("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca', 'onn.', 73, 0, true, now()),
 ('Sistema', 'Google TV', 73, 1, true, now()),
 ('Resolución', 'Full HD 1080p', 73, 2, true, now()),
 ('Audio', 'Dolby Audio', 73, 3, true, now()),
 ('Conexión', 'HDMI + WiFi', 73, 4, true, now()),
 ('Control', 'Remoto por voz (Google Assistant)', 73, 5, true, now());
