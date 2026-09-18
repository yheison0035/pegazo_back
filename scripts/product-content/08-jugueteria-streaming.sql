-- ============================================================================
-- Contenido · JUGUETERIA (10) + pendientes STREAMING/CONSOLAS/CAMARAS/
-- PROYECTORES/TERMOS (10). Descripción + características + specs. Idempotente.
-- ============================================================================

-- ═══════════ STREAMING / CONSOLAS / CAMARAS / PROYECTORES / TERMOS ═══════════

UPDATE "Inventory" SET description='<p>Convierte tu televisor en un Smart TV con el <strong>TV Box onn.</strong> Accede a Netflix, YouTube, Disney+, Prime Video y todas tus apps en un solo lugar, con control remoto por voz. Se conecta por HDMI y WiFi: instálalo y empieza a ver.</p>' WHERE id=145;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=145;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Todas tus apps de streaming en un solo lugar',145,0,true,now()),('Control remoto por voz',145,1,true,now()),('Se conecta por HDMI y WiFi',145,2,true,now()),('Fácil de instalar',145,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=145;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','onn.',145,0,true,now()),('Tipo','TV Box / streaming',145,1,true,now()),('Conexión','HDMI + WiFi',145,2,true,now());

UPDATE "Inventory" SET description='<p>Lleva el cine a tu pared con el <strong>proyector portátil</strong>. Conéctalo a tu celular, USB, consola o TV Box y proyecta películas, series y juegos en grande. Compacto, fácil de usar e ideal para disfrutar en casa.</p>' WHERE id=254;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=254;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Proyecta películas, series y juegos',254,0,true,now()),('Conexión con celular, USB y consola',254,1,true,now()),('Imagen grande ajustable',254,2,true,now()),('Compacto y fácil de usar',254,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=254;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Proyector LED',254,0,true,now()),('Entradas','HDMI, USB',254,1,true,now()),('Uso','Interior / poca luz',254,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola Game TV Stick</strong> se conecta al HDMI de tu televisor y trae miles de juegos retro listos para jugar. Incluye controles inalámbricos para jugar en familia, con salida de video de alta definición. Plug and play.</p>' WHERE id=248;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=248;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Miles de juegos retro listos para jugar',248,0,true,now()),('Incluye controles inalámbricos',248,1,true,now()),('Se conecta al HDMI del televisor',248,2,true,now()),('Plug and play: sin instalaciones',248,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=248;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Consola Game Stick',248,0,true,now()),('Conexión','HDMI',248,1,true,now()),('Controles','Inalámbricos',248,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola portátil retro R36S</strong> trae miles de juegos clásicos en la palma de tu mano. Pantalla a color, buena batería y controles cómodos para jugar donde quieras. Ideal para revivir tus juegos favoritos.</p>' WHERE id=249;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=249;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Miles de juegos retro incluidos',249,0,true,now()),('Pantalla a color y controles cómodos',249,1,true,now()),('Portátil: juega donde quieras',249,2,true,now()),('Batería recargable',249,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=249;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','R36S',249,0,true,now()),('Tipo','Consola portátil retro',249,1,true,now()),('Alimentación','Recargable',249,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola de videojuegos retro con gamepad 2.4G</strong> se conecta a tu TV y trae cientos de juegos clásicos con dos controles inalámbricos para jugar en pareja. Fácil de instalar y lista para la diversión en familia.</p>' WHERE id=250;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=250;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cientos de juegos retro incluidos',250,0,true,now()),('Dos controles inalámbricos 2.4G',250,1,true,now()),('Se conecta al televisor',250,2,true,now()),('Ideal para jugar en familia',250,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=250;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Consola retro',250,0,true,now()),('Controles','2 inalámbricos (2.4G)',250,1,true,now()),('Conexión','HDMI / AV',250,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola portátil Game Player</strong> reúne cientos de juegos clásicos para llevar a todas partes. Pantalla a color, controles integrados y batería recargable. Diversión retro en tus manos, para grandes y chicos.</p>' WHERE id=251;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=251;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cientos de juegos clásicos incluidos',251,0,true,now()),('Pantalla a color y controles integrados',251,1,true,now()),('Portátil y recargable',251,2,true,now()),('Diversión para grandes y chicos',251,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=251;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Consola portátil',251,0,true,now()),('Alimentación','Recargable',251,1,true,now());

UPDATE "Inventory" SET description='<p>Captura fotos y videos aéreos con el <strong>dron plegable 998 Pro con cámara 4K</strong>. Se controla desde el celular, mantiene el vuelo estable y se pliega para llevarlo fácil. Ideal para grabar paisajes y momentos desde el aire.</p>' WHERE id=261;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=261;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cámara para fotos y video aéreo',261,0,true,now()),('Se controla desde el celular',261,1,true,now()),('Vuelo estable y plegable',261,2,true,now()),('Fácil de transportar',261,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=261;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','998 Pro',261,0,true,now()),('Tipo','Dron plegable',261,1,true,now()),('Control','Por celular / control remoto',261,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>cámara instantánea para niños</strong> toma fotos y las imprime al instante en papel, sin tinta. Divertida y fácil de usar, también graba video y tiene juegos. Un regalo ideal para estimular la creatividad de los más pequeños.</p>' WHERE id=268;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=268;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Toma e imprime fotos al instante',268,0,true,now()),('Impresión sin tinta',268,1,true,now()),('También graba video y trae juegos',268,2,true,now()),('Fácil de usar para niños',268,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=268;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cámara instantánea infantil',268,0,true,now()),('Impresión','Térmica sin tinta',268,1,true,now()),('Alimentación','Recargable',268,2,true,now());

UPDATE "Inventory" SET description='<p>Vigila tu casa o negocio con la <strong>cámara robótica de seguridad WiFi V380 de 3 antenas</strong>. Ves en vivo desde el celular, con visión nocturna, audio de dos vías y seguimiento de movimiento. Ideal para exteriores, resistente y potente.</p>' WHERE id=149;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=149;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('3 antenas para mejor señal WiFi',149,0,true,now()),('Ves en vivo desde el celular (app V380)',149,1,true,now()),('Visión nocturna y audio de dos vías',149,2,true,now()),('Seguimiento de movimiento',149,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=149;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('App','V380 Pro',149,0,true,now()),('Conexión','WiFi',149,1,true,now()),('Uso','Exterior / seguridad',149,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>termo Hello Cappy</strong> es ideal para los niños: conserva la bebida a buena temperatura y trae pitillo para beber fácil. Diseño divertido, cierre seguro y materiales resistentes para el colegio o el paseo.</p>' WHERE id=444;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=444;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Conserva la bebida a buena temperatura',444,0,true,now()),('Trae pitillo para beber fácil',444,1,true,now()),('Diseño divertido para niños',444,2,true,now()),('Cierre seguro antiderrames',444,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=444;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Termo infantil con pitillo',444,0,true,now()),('Uso','Colegio / paseo',444,1,true,now());

-- ═══════════════ JUGUETERIA ═══════════════

UPDATE "Inventory" SET description='<p>La <strong>consola portátil M7</strong> trae cientos de juegos retro para divertirte donde quieras. Pantalla a color, controles cómodos y batería recargable. Ideal para regalar y revivir los clásicos.</p>' WHERE id=158;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=158;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cientos de juegos retro incluidos',158,0,true,now()),('Pantalla a color y controles cómodos',158,1,true,now()),('Portátil y recargable',158,2,true,now()),('Ideal para regalar',158,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=158;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','M7',158,0,true,now()),('Tipo','Consola portátil retro',158,1,true,now()),('Alimentación','Recargable',158,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola portátil retro R36S</strong> pone miles de juegos clásicos en tus manos. Pantalla a color nítida, buena batería y controles cómodos para jugar en casa o de viaje. Diversión retro para todas las edades.</p>' WHERE id=72;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=72;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Miles de juegos retro incluidos',72,0,true,now()),('Pantalla a color nítida',72,1,true,now()),('Portátil con buena batería',72,2,true,now()),('Controles cómodos',72,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=72;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','R36S',72,0,true,now()),('Tipo','Consola portátil retro',72,1,true,now()),('Alimentación','Recargable',72,2,true,now());

UPDATE "Inventory" SET description='<p>Verifica tus billetes al instante con el <strong>detector de billetes</strong>. Su luz ultravioleta revela las marcas de seguridad para identificar billetes falsos de forma rápida y sencilla. Ideal para negocios, tiendas y uso diario.</p>' WHERE id=16;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=16;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Detecta billetes falsos con luz UV',16,0,true,now()),('Verificación rápida y sencilla',16,1,true,now()),('Ideal para negocios y tiendas',16,2,true,now()),('Compacto y fácil de usar',16,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=16;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Detector de billetes UV',16,0,true,now()),('Uso','Negocios / caja',16,1,true,now());

UPDATE "Inventory" SET description='<p>Captura tomas aéreas con el <strong>dron 998</strong>. Fácil de controlar, con vuelo estable y cámara para grabar desde el aire. Divertido para grandes y chicos, ideal para dar tus primeros vuelos y grabar paisajes.</p>' WHERE id=15;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=15;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cámara para grabar desde el aire',15,0,true,now()),('Vuelo estable y fácil de controlar',15,1,true,now()),('Divertido para grandes y chicos',15,2,true,now()),('Ideal para principiantes',15,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=15;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','998',15,0,true,now()),('Tipo','Dron con cámara',15,1,true,now());

UPDATE "Inventory" SET description='<p>Infla globos en segundos con el <strong>inflador de globos eléctrico</strong>. Ahorra tiempo y esfuerzo en fiestas, cumpleaños y decoraciones. Potente, práctico y fácil de usar: solo conecta y listo.</p>' WHERE id=417;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=417;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Infla globos en segundos',417,0,true,now()),('Ahorra tiempo y esfuerzo',417,1,true,now()),('Ideal para fiestas y decoraciones',417,2,true,now()),('Potente y fácil de usar',417,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=417;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Inflador eléctrico de globos',417,0,true,now()),('Uso','Fiestas / eventos',417,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>kit de colores</strong> trae todo para que los niños dibujen y creen: colores, marcadores, crayones y más en un solo estuche. Ideal para el colegio, la casa y estimular la creatividad de los pequeños.</p>' WHERE id=69;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=69;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Set completo para dibujar y colorear',69,0,true,now()),('Incluye colores, marcadores y crayones',69,1,true,now()),('Estimula la creatividad',69,2,true,now()),('Ideal para el colegio y la casa',69,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=69;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Kit de arte / colores',69,0,true,now()),('Uso','Niños',69,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>lámpara esfera</strong> proyecta luces y estrellas que crean un ambiente relajante en la habitación. Ideal como luz nocturna para niños o para decorar tu cuarto. Con varios colores y efectos.</p>' WHERE id=152;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=152;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Proyecta luces y estrellas',152,0,true,now()),('Crea un ambiente relajante',152,1,true,now()),('Varios colores y efectos',152,2,true,now()),('Ideal como luz nocturna',152,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=152;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Lámpara / proyector LED',152,0,true,now()),('Uso','Decoración / luz nocturna',152,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pistola de hidrogel P90</strong> dispara bolitas de gel de agua que se deshacen al impactar, para jugar al aire libre de forma divertida. Recargable, con buen alcance e ideal para partidas entre amigos. Incluye bolitas de hidrogel.</p>' WHERE id=52;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=52;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Dispara bolitas de hidrogel de agua',52,0,true,now()),('Diversión al aire libre entre amigos',52,1,true,now()),('Buen alcance y recargable',52,2,true,now()),('Incluye bolitas de hidrogel',52,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=52;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','P90',52,0,true,now()),('Tipo','Lanzador de hidrogel',52,1,true,now()),('Alimentación','Recargable',52,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>consola portátil Game Player</strong> trae cientos de juegos clásicos para llevar a donde quieras. Pantalla a color, controles integrados y batería recargable. Diversión retro en tus manos para toda la familia.</p>' WHERE id=410;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=410;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cientos de juegos clásicos incluidos',410,0,true,now()),('Pantalla a color y controles integrados',410,1,true,now()),('Portátil y recargable',410,2,true,now()),('Diversión para toda la familia',410,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=410;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Consola portátil',410,0,true,now()),('Alimentación','Recargable',410,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>scooter</strong> es ideal para que los niños se diviertan y ejerciten al aire libre. Estructura resistente, manubrio ajustable y ruedas suaves para un paseo seguro. Se pliega para guardarlo y transportarlo fácil.</p>' WHERE id=37;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=37;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diversión y ejercicio al aire libre',37,0,true,now()),('Manubrio ajustable a la altura',37,1,true,now()),('Ruedas suaves y estructura resistente',37,2,true,now()),('Plegable para guardar y transportar',37,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=37;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Scooter / patineta',37,0,true,now()),('Uso','Niños',37,1,true,now());
