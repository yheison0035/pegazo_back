-- ============================================================================
-- Contenido · BARBERIA (20). Solo descripción + características + specs.
-- No se cambian nombres (ya tienen marca/modelo). Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Aféitate al ras y sin irritación con la <strong>afeitadora rotativa VGR-331</strong>. Sus cabezales flotantes se adaptan al rostro para un afeitado apurado y cómodo. Recargable e inalámbrica, ideal para el uso diario.</p>' WHERE id=151;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=151;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cabezales rotativos que se adaptan al rostro',151,0,true,now()),('Afeitado al ras y cómodo',151,1,true,now()),('Inalámbrica y recargable',151,2,true,now()),('Fácil de limpiar',151,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=151;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-331',151,0,true,now()),('Tipo','Afeitadora rotativa',151,1,true,now()),('Alimentación','Recargable',151,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>afeitadora rotativa VGR-332 con pantalla</strong> te muestra el nivel de batería para que nunca te quedes a medias. Cabezales flotantes para un afeitado al ras y sin irritación. Inalámbrica y recargable por USB.</p>' WHERE id=150;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=150;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pantalla con nivel de batería',150,0,true,now()),('Cabezales rotativos flotantes',150,1,true,now()),('Afeitado al ras y sin irritación',150,2,true,now()),('Inalámbrica y recargable por USB',150,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=150;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-332',150,0,true,now()),('Tipo','Afeitadora rotativa',150,1,true,now()),('Pantalla','Nivel de batería',150,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina Geemy 3 en 1 para hombre</strong> es tu kit de arreglo personal completo: corta cabello, perfila barba y patillas, y recorta vello. Inalámbrica, recargable y con accesorios para cada zona.</p>' WHERE id=388;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=388;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('3 en 1: cabello, barba y vello',388,0,true,now()),('Varios cabezales y peines guía',388,1,true,now()),('Inalámbrica y recargable',388,2,true,now()),('Práctica para el arreglo en casa',388,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=388;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Geemy',388,0,true,now()),('Tipo','Kit 3 en 1',388,1,true,now()),('Alimentación','Recargable',388,2,true,now());

UPDATE "Inventory" SET description='<p>Consiente a tu mascota en casa con la <strong>máquina Geemy para mascotas</strong>. Corta y empareja el pelo de perros y gatos con motor silencioso para no asustarlos. Inalámbrica, recargable y con peines guía.</p>' WHERE id=78;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=78;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseñada para el pelo de mascotas',78,0,true,now()),('Motor silencioso que no asusta',78,1,true,now()),('Peines guía para distintos largos',78,2,true,now()),('Inalámbrica y recargable',78,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=78;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Geemy',78,0,true,now()),('Uso','Corte de pelo de mascotas',78,1,true,now()),('Alimentación','Recargable',78,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera HTC AT-566</strong> es ideal para cortar y emparejar el cabello en casa o en la barbería. Cuchillas de precisión, motor firme y peines guía para lograr distintos largos. Inalámbrica y recargable.</p>' WHERE id=360;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=360;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cuchillas de precisión para un buen corte',360,0,true,now()),('Peines guía para distintos largos',360,1,true,now()),('Motor firme y duradero',360,2,true,now()),('Inalámbrica y recargable',360,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=360;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','HTC AT-566',360,0,true,now()),('Tipo','Máquina peluquera',360,1,true,now()),('Alimentación','Recargable',360,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>mini afeitadora portátil</strong> cabe en tu bolsillo para un afeitado rápido donde estés. Perfecta para retoques de última hora en el rostro. Inalámbrica, recargable y muy fácil de usar y limpiar.</p>' WHERE id=77;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=77;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tamaño mini: cabe en el bolsillo',77,0,true,now()),('Ideal para retoques rápidos',77,1,true,now()),('Inalámbrica y recargable',77,2,true,now()),('Fácil de usar y limpiar',77,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=77;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini afeitadora',77,0,true,now()),('Alimentación','Recargable',77,1,true,now());

UPDATE "Inventory" SET description='<p>Perfila tu barba, patillas y contornos con precisión usando la <strong>patillera Buda</strong>. Su cuchilla delgada permite líneas nítidas y detalles finos. Inalámbrica, recargable e ideal para el acabado profesional.</p>' WHERE id=418;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=418;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cuchilla delgada para líneas nítidas',418,0,true,now()),('Perfila barba, patillas y contornos',418,1,true,now()),('Ideal para el acabado profesional',418,2,true,now()),('Inalámbrica y recargable',418,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=418;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Patillera / perfiladora',418,0,true,now()),('Modelo','Buda',418,1,true,now()),('Alimentación','Recargable',418,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>patillera con pantalla</strong> te muestra la batería mientras perfilas barba y contornos con precisión. Cuchilla delgada para líneas limpias y detalles finos. Inalámbrica y recargable por USB.</p>' WHERE id=385;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=385;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pantalla con nivel de batería',385,0,true,now()),('Cuchilla delgada para líneas limpias',385,1,true,now()),('Perfila barba, patillas y contornos',385,2,true,now()),('Inalámbrica y recargable por USB',385,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=385;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Patillera / perfiladora',385,0,true,now()),('Pantalla','Nivel de batería',385,1,true,now()),('Alimentación','Recargable',385,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>patillera GW-9775</strong> es ideal para perfilar barba, bigote y patillas con precisión. Cuchilla delgada para contornos limpios y detalles finos. Inalámbrica, recargable y cómoda de manejar.</p>' WHERE id=804;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=804;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Perfila barba, bigote y patillas',804,0,true,now()),('Cuchilla delgada para contornos limpios',804,1,true,now()),('Inalámbrica y recargable',804,2,true,now()),('Cómoda de manejar',804,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=804;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','GW-9775',804,0,true,now()),('Tipo','Patillera',804,1,true,now()),('Alimentación','Recargable',804,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>patillera VGR-071</strong> perfila barba, patillas y contornos con líneas nítidas gracias a su cuchilla de precisión. Inalámbrica y recargable, es ideal para el acabado y los detalles en casa o en la barbería.</p>' WHERE id=428;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=428;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cuchilla de precisión para líneas nítidas',428,0,true,now()),('Perfila barba, patillas y contornos',428,1,true,now()),('Ideal para acabados y detalles',428,2,true,now()),('Inalámbrica y recargable',428,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=428;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-071',428,0,true,now()),('Tipo','Patillera',428,1,true,now()),('Alimentación','Recargable',428,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera Kemei KM-2296</strong> corta y empareja el cabello con potencia y precisión. Cuchillas resistentes y peines guía para distintos largos. Inalámbrica, recargable e ideal para casa o barbería.</p>' WHERE id=429;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=429;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corta y empareja con precisión',429,0,true,now()),('Peines guía para distintos largos',429,1,true,now()),('Cuchillas resistentes',429,2,true,now()),('Inalámbrica y recargable',429,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=429;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Kemei KM-2296',429,0,true,now()),('Tipo','Máquina peluquera',429,1,true,now()),('Alimentación','Recargable',429,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>afeitadora rotativa Kemei 2024</strong> ofrece un afeitado al ras y cómodo con sus cabezales flotantes que se adaptan al rostro. Inalámbrica y recargable, práctica para el uso diario.</p>' WHERE id=359;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=359;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cabezales rotativos flotantes',359,0,true,now()),('Afeitado al ras y cómodo',359,1,true,now()),('Inalámbrica y recargable',359,2,true,now()),('Fácil de limpiar',359,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=359;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Kemei 2024',359,0,true,now()),('Tipo','Afeitadora rotativa',359,1,true,now()),('Alimentación','Recargable',359,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>afeitadora rotativa VGR-331</strong> se adapta al rostro con sus cabezales flotantes para un afeitado apurado y sin irritación. Inalámbrica, recargable y cómoda para el uso de todos los días.</p>' WHERE id=681;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=681;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cabezales rotativos que se adaptan al rostro',681,0,true,now()),('Afeitado al ras y sin irritación',681,1,true,now()),('Inalámbrica y recargable',681,2,true,now()),('Fácil de limpiar',681,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=681;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-331',681,0,true,now()),('Tipo','Afeitadora rotativa',681,1,true,now()),('Alimentación','Recargable',681,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>afeitadora rotativa VGR-332</strong> te da un afeitado al ras y cómodo con sus tres cabezales flotantes. Inalámbrica y recargable, ideal para mantener tu rostro impecable a diario.</p>' WHERE id=353;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=353;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tres cabezales rotativos flotantes',353,0,true,now()),('Afeitado al ras y cómodo',353,1,true,now()),('Inalámbrica y recargable',353,2,true,now()),('Fácil de limpiar',353,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=353;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-332',353,0,true,now()),('Tipo','Afeitadora rotativa',353,1,true,now()),('Alimentación','Recargable',353,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>afeitadora rotativa VGR-353</strong> combina cabezales flotantes y buena potencia para un afeitado apurado y sin irritación. Inalámbrica y recargable por USB, cómoda para el uso diario.</p>' WHERE id=427;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=427;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cabezales rotativos flotantes',427,0,true,now()),('Afeitado al ras y sin irritación',427,1,true,now()),('Inalámbrica y recargable por USB',427,2,true,now()),('Fácil de limpiar',427,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=427;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-353',427,0,true,now()),('Tipo','Afeitadora rotativa',427,1,true,now()),('Alimentación','Recargable',427,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera VGR-071</strong> es ideal para cortar cabello y perfilar en casa o en la barbería. Cuchillas de precisión y peines guía para distintos largos. Inalámbrica y recargable.</p>' WHERE id=11;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=11;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cuchillas de precisión',11,0,true,now()),('Peines guía para distintos largos',11,1,true,now()),('Corta y perfila',11,2,true,now()),('Inalámbrica y recargable',11,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=11;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-071',11,0,true,now()),('Tipo','Máquina de corte',11,1,true,now()),('Alimentación','Recargable',11,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera VGR-282</strong> corta y empareja el cabello con potencia y precisión. Cuchillas resistentes y peines guía para lograr distintos largos. Inalámbrica, recargable e ideal para casa o barbería.</p>' WHERE id=80;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=80;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corta y empareja con precisión',80,0,true,now()),('Peines guía para distintos largos',80,1,true,now()),('Cuchillas resistentes',80,2,true,now()),('Inalámbrica y recargable',80,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=80;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-282',80,0,true,now()),('Tipo','Máquina peluquera',80,1,true,now()),('Alimentación','Recargable',80,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera VGR-660</strong> ofrece un corte potente y preciso para casa o barbería. Cuchillas resistentes y peines guía para distintos largos. Inalámbrica y recargable por USB.</p>' WHERE id=10;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=10;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corte potente y preciso',10,0,true,now()),('Peines guía para distintos largos',10,1,true,now()),('Cuchillas resistentes',10,2,true,now()),('Inalámbrica y recargable por USB',10,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=10;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','VGR-660',10,0,true,now()),('Tipo','Máquina peluquera',10,1,true,now()),('Alimentación','Recargable',10,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera Werhl 11059</strong> es ideal para cortar y emparejar el cabello con precisión. Motor firme, cuchillas resistentes y peines guía para distintos largos. Inalámbrica y recargable.</p>' WHERE id=18;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=18;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corte preciso y parejo',18,0,true,now()),('Motor firme y cuchillas resistentes',18,1,true,now()),('Peines guía para distintos largos',18,2,true,now()),('Inalámbrica y recargable',18,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=18;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Werhl 11059',18,0,true,now()),('Tipo','Máquina peluquera',18,1,true,now()),('Alimentación','Recargable',18,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina peluquera Werhl 8553</strong> corta y empareja el cabello con buena potencia y precisión. Cuchillas resistentes y peines guía para distintos largos. Inalámbrica, recargable y cómoda de usar.</p>' WHERE id=79;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=79;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corta y empareja con precisión',79,0,true,now()),('Peines guía para distintos largos',79,1,true,now()),('Cuchillas resistentes',79,2,true,now()),('Inalámbrica y recargable',79,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=79;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Werhl 8553',79,0,true,now()),('Tipo','Máquina peluquera',79,1,true,now()),('Alimentación','Recargable',79,2,true,now());
