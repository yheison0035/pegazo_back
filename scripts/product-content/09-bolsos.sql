-- ============================================================================
-- Contenido · BOLSOS (11). Descripción + características + specs. Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>El <strong>bolso Picocici para niña y niño</strong> es práctico y resistente para el colegio o los paseos. Amplio, cómodo de llevar y con diseño divertido que les encanta. Materiales durables para el uso diario.</p>' WHERE id=224;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=224;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseño divertido para niños y niñas',224,0,true,now()),('Amplio y cómodo de llevar',224,1,true,now()),('Materiales resistentes',224,2,true,now()),('Ideal para colegio y paseos',224,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=224;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Picocici',224,0,true,now()),('Uso','Niños',224,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>bolso Picocici</strong> combina estilo y practicidad para el día a día. Espacio suficiente para tus cosas, cómodo de cargar y con acabado moderno. Resistente para acompañarte a todas partes.</p>' WHERE id=443;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=443;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseño moderno y práctico',443,0,true,now()),('Espacio suficiente para tus cosas',443,1,true,now()),('Cómodo de cargar',443,2,true,now()),('Materiales resistentes',443,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=443;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Picocici',443,0,true,now()),('Tipo','Bolso',443,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>estuche para reloj</strong> protege y luce tu reloj cuando no lo usas. Interior acolchado que evita rayones, ideal para guardar o regalar. Elegante y práctico.</p>' WHERE id=350;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=350;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Interior acolchado que protege el reloj',350,0,true,now()),('Evita rayones y golpes',350,1,true,now()),('Ideal para guardar o regalar',350,2,true,now()),('Elegante y compacto',350,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=350;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Estuche para reloj',350,0,true,now()),('Interior','Acolchado',350,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>caja para reloj</strong> guarda y organiza tus relojes con estilo. Interior acolchado que los protege de rayones y polvo. Perfecta para tu colección o como regalo.</p>' WHERE id=347;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=347;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Guarda y organiza tus relojes',347,0,true,now()),('Interior acolchado protector',347,1,true,now()),('Los protege de rayones y polvo',347,2,true,now()),('Ideal para colección o regalo',347,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=347;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Caja organizadora de relojes',347,0,true,now()),('Interior','Acolchado',347,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>caja para reloj en cuero</strong> combina elegancia y protección. Su acabado en cuero y el interior acolchado cuidan tu reloj de rayones. Perfecta para guardar, exhibir o regalar.</p>' WHERE id=349;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=349;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Acabado elegante en cuero',349,0,true,now()),('Interior acolchado que protege el reloj',349,1,true,now()),('Ideal para exhibir o regalar',349,2,true,now()),('Resistente y con estilo',349,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=349;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Caja para reloj',349,0,true,now()),('Material','Cuero',349,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>estuche individual para reloj</strong> protege tu reloj y lo mantiene como nuevo. Interior acolchado que evita rayones, ideal para guardar o presentar tu reloj como regalo. Elegante y práctico.</p>' WHERE id=348;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=348;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Interior acolchado que protege el reloj',348,0,true,now()),('Ideal para guardar o regalar',348,1,true,now()),('Presentación elegante',348,2,true,now()),('Compacto y resistente',348,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=348;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Estuche para reloj',348,0,true,now()),('Interior','Acolchado',348,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>kit de herramientas de 46 piezas</strong> reúne copas, puntas y accesorios para tus reparaciones en casa o el carro. Todo organizado en su estuche, en acero resistente. Práctico para tener siempre a la mano.</p>' WHERE id=252;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=252;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('46 piezas: copas, puntas y accesorios',252,0,true,now()),('En acero resistente',252,1,true,now()),('Organizado en su estuche',252,2,true,now()),('Ideal para casa y carro',252,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=252;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Kit de herramientas',252,0,true,now()),('Piezas','46',252,1,true,now()),('Material','Acero',252,2,true,now());

UPDATE "Inventory" SET description='<p>Lleva tu celular a la vista mientras manejas con el <strong>porta celular para motos</strong>. Sujeta firme el teléfono al manubrio para usar el GPS o recibir llamadas con seguridad. Ajustable y resistente al movimiento.</p>' WHERE id=258;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=258;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sujeta firme el celular al manubrio',258,0,true,now()),('Ideal para usar el GPS en la moto',258,1,true,now()),('Ajustable a distintos tamaños',258,2,true,now()),('Resistente al movimiento',258,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=258;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Soporte de celular para moto',258,0,true,now()),('Instalación','Manubrio',258,1,true,now());

UPDATE "Inventory" SET description='<p>Disfruta películas, series y juegos en pantalla grande con el <strong>proyector multimedia</strong>. Conéctalo a tu celular, consola o USB y proyecta en la pared. Compacto y fácil de usar, ideal para el cine en casa.</p>' WHERE id=172;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=172;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Proyecta películas, series y juegos',172,0,true,now()),('Conexión con celular, consola y USB',172,1,true,now()),('Imagen grande en la pared',172,2,true,now()),('Compacto y fácil de usar',172,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=172;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Proyector multimedia',172,0,true,now()),('Entradas','HDMI, USB',172,1,true,now()),('Uso','Interior / poca luz',172,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>soporte de teléfono para motocicleta Moxom MX-VS41</strong> mantiene tu celular firme y a la vista en el manublio. Agarre seguro y ajustable para usar el GPS o contestar con tranquilidad mientras ruedas.</p>' WHERE id=260;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=260;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agarre firme y seguro al manubrio',260,0,true,now()),('Ideal para GPS en la moto',260,1,true,now()),('Ajustable a distintos celulares',260,2,true,now()),('Resistente a vibraciones',260,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=260;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Moxom MX-VS41',260,0,true,now()),('Tipo','Soporte de celular para moto',260,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>soporte de teléfono para bicicleta Moxom MX-VS42</strong> sujeta tu celular al manubrio para que sigas tu ruta con el GPS a la vista. Agarre seguro, ajustable y resistente a los golpes del camino.</p>' WHERE id=259;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=259;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sujeta el celular al manubrio de la bici',259,0,true,now()),('Ideal para seguir el GPS',259,1,true,now()),('Ajustable y con agarre seguro',259,2,true,now()),('Resistente a los golpes del camino',259,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=259;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Moxom MX-VS42',259,0,true,now()),('Tipo','Soporte de celular para bicicleta',259,1,true,now());
