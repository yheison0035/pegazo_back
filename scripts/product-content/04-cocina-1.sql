-- ============================================================================
-- Contenido · COCINA (tanda 1: baterías, ollas, sartenes, freidoras, cuchillos)
-- Descripción + características + especificaciones. Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Cocina más sano y sin que se pegue la comida. Esta <strong>batería de acero quirúrgico de 12 piezas</strong> distribuye el calor de forma pareja y sirve para cocinar con poca grasa. Resistente, fácil de limpiar y apta para toda la familia.</p>' WHERE id=86;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=86;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Juego completo de 12 piezas',86,0,true,now()),('Acero quirúrgico resistente y duradero',86,1,true,now()),('Cocina con poca grasa, más saludable',86,2,true,now()),('Distribuye el calor de forma pareja',86,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=86;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero quirúrgico',86,0,true,now()),('Piezas','12',86,1,true,now()),('Apta para','Estufa de gas y eléctrica',86,2,true,now());

UPDATE "Inventory" SET description='<p>Juego de <strong>batería de acero quirúrgico con tetera</strong> para equipar tu cocina completa. Ollas resistentes que reparten bien el calor y cocinan con poca grasa, más la práctica tetera a juego. Fácil de limpiar y de larga duración.</p>' WHERE id=712;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=712;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Incluye tetera a juego',712,0,true,now()),('Acero quirúrgico resistente',712,1,true,now()),('Cocina con poca grasa',712,2,true,now()),('Fácil de limpiar',712,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=712;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero quirúrgico',712,0,true,now()),('Incluye','Ollas + tetera',712,1,true,now()),('Apta para','Estufa de gas y eléctrica',712,2,true,now());

UPDATE "Inventory" SET description='<p>Equipa tu cocina con esta <strong>batería de acero quirúrgico</strong>: ollas resistentes que reparten el calor de forma uniforme y permiten cocinar con menos grasa. Duraderas, fáciles de lavar y con acabado elegante.</p>' WHERE id=87;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=87;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Acero quirúrgico resistente y duradero',87,0,true,now()),('Cocina con poca grasa',87,1,true,now()),('Reparte el calor de forma uniforme',87,2,true,now()),('Fácil de lavar',87,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=87;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero quirúrgico',87,0,true,now()),('Apta para','Estufa de gas y eléctrica',87,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Batería de cocina</strong> resistente para el uso diario. Sus ollas reparten bien el calor y facilitan preparar todo tipo de recetas para la familia. Práctica de lavar y de larga duración.</p>' WHERE id=89;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=89;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Juego de ollas resistente',89,0,true,now()),('Reparte bien el calor',89,1,true,now()),('Ideal para el uso diario',89,2,true,now()),('Fácil de lavar',89,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=89;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Batería de cocina',89,0,true,now()),('Apta para','Estufa de gas y eléctrica',89,1,true,now());

UPDATE "Inventory" SET description='<p>Dale un toque moderno a tu cocina con la <strong>batería de piedra mármol de 7 piezas</strong>, versión económica. Su antiadherente tipo piedra evita que la comida se pegue y usa menos aceite. Ligera, resistente y fácil de limpiar.</p>' WHERE id=437;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=437;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Antiadherente tipo piedra: la comida no se pega',437,0,true,now()),('Juego de 7 piezas',437,1,true,now()),('Cocina con menos aceite',437,2,true,now()),('Ligera y fácil de limpiar',437,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=437;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Recubrimiento','Antiadherente piedra mármol',437,0,true,now()),('Piezas','7',437,1,true,now()),('Apta para','Estufa de gas y eléctrica',437,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>batería de cocina línea Tokio</strong> combina diseño y resistencia para tu día a día. Ollas con buen reparto de calor para cocinar cómodamente, fáciles de lavar y de larga duración.</p>' WHERE id=88;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=88;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseño moderno y resistente',88,0,true,now()),('Buen reparto del calor',88,1,true,now()),('Cómoda para el uso diario',88,2,true,now()),('Fácil de lavar',88,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=88;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Línea','Tokio',88,0,true,now()),('Tipo','Batería de cocina',88,1,true,now()),('Apta para','Estufa de gas y eléctrica',88,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>batería de piedra mármol de 7 piezas</strong> renueva tu cocina con su antiadherente tipo piedra que evita que la comida se pegue y permite cocinar con menos aceite. Resistente, ligera y fácil de limpiar.</p>' WHERE id=436;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=436;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Antiadherente tipo piedra: la comida no se pega',436,0,true,now()),('Juego de 7 piezas',436,1,true,now()),('Cocina con menos aceite',436,2,true,now()),('Ligera y fácil de limpiar',436,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=436;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Recubrimiento','Antiadherente piedra mármol',436,0,true,now()),('Piezas','7',436,1,true,now()),('Apta para','Estufa de gas y eléctrica',436,2,true,now());

UPDATE "Inventory" SET description='<p><strong>Juego de cuchillos de acero</strong> para todas tus preparaciones: cortar carnes, verduras, pan y más. Hojas filosas de acero inoxidable con mangos cómodos y antideslizantes. Un básico que no puede faltar en tu cocina.</p>' WHERE id=407;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=407;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hojas filosas de acero inoxidable',407,0,true,now()),('Sirven para carnes, verduras y pan',407,1,true,now()),('Mangos cómodos y antideslizantes',407,2,true,now()),('Fáciles de lavar',407,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=407;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero inoxidable',407,0,true,now()),('Tipo','Juego de cuchillos',407,1,true,now());

UPDATE "Inventory" SET description='<p>Olla en <strong>acero quirúrgico de 5 litros</strong>, ideal para sopas, granos y guisos para toda la familia. Reparte el calor de forma pareja, cocina con poca grasa y es muy resistente. Fácil de lavar y de larga duración.</p>' WHERE id=683;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=683;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Capacidad de 5 litros',683,0,true,now()),('Acero quirúrgico resistente',683,1,true,now()),('Ideal para sopas, granos y guisos',683,2,true,now()),('Cocina con poca grasa',683,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=683;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero quirúrgico',683,0,true,now()),('Capacidad','5 litros',683,1,true,now()),('Apta para','Estufa de gas y eléctrica',683,2,true,now());

UPDATE "Inventory" SET description='<p>Cocina más rápido y ahorra gas con la <strong>olla a presión de 7 litros</strong>. Ideal para granos, carnes y sopas: reduce el tiempo de cocción a la mitad. Con válvula de seguridad y gran capacidad para la familia.</p>' WHERE id=682;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=682;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Capacidad de 7 litros',682,0,true,now()),('Cocina más rápido y ahorra gas',682,1,true,now()),('Válvula de seguridad',682,2,true,now()),('Ideal para granos, carnes y sopas',682,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=682;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Olla a presión',682,0,true,now()),('Capacidad','7 litros',682,1,true,now()),('Seguridad','Válvula de presión',682,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>olla multifuncional</strong> es tu aliada para cocinar de todo en un solo lugar: sopas, arroces, guisos y más. Práctica, resistente y fácil de usar para el día a día en tu cocina.</p>' WHERE id=92;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=92;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sirve para sopas, arroces y guisos',92,0,true,now()),('Práctica y resistente',92,1,true,now()),('Fácil de usar y limpiar',92,2,true,now()),('Ideal para el uso diario',92,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=92;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Olla multifuncional',92,0,true,now()),('Uso','Cocina general',92,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>sartén doble de cerámica</strong> te deja voltear tus preparaciones sin ensuciar: perfecto para tortillas, arepas rellenas, pescado y más. Antiadherente cerámico que usa poco aceite y se limpia fácil.</p>' WHERE id=90;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=90;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Doble cara: voltea sin ensuciar',90,0,true,now()),('Antiadherente cerámico',90,1,true,now()),('Ideal para tortillas, arepas y pescado',90,2,true,now()),('Usa poco aceite y se limpia fácil',90,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=90;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Sartén doble',90,0,true,now()),('Recubrimiento','Cerámico antiadherente',90,1,true,now());

UPDATE "Inventory" SET description='<p>Prepara huevos perfectos y parejos con el <strong>sartén para 3 huevos</strong>. Sus divisiones mantienen cada huevo en su lugar; también sirve para pancakes o arepas pequeñas. Antiadherente y fácil de limpiar.</p>' WHERE id=91;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=91;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('3 divisiones para huevos parejos',91,0,true,now()),('También para pancakes y arepas pequeñas',91,1,true,now()),('Antiadherente: usa poco aceite',91,2,true,now()),('Fácil de limpiar',91,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=91;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Divisiones','3',91,0,true,now()),('Recubrimiento','Antiadherente',91,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>sartén para 4 huevos</strong> te permite cocinar varios a la vez, cada uno en su división para que queden parejos. Ideal también para pancakes o arepas pequeñas. Antiadherente y fácil de lavar.</p>' WHERE id=362;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=362;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('4 divisiones para cocinar varios a la vez',362,0,true,now()),('También para pancakes y arepas pequeñas',362,1,true,now()),('Antiadherente: usa poco aceite',362,2,true,now()),('Fácil de limpiar',362,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=362;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Divisiones','4',362,0,true,now()),('Recubrimiento','Antiadherente',362,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>sartén para 7 huevos</strong> es perfecto para preparar el desayuno de toda la familia de una sola vez. Cada división mantiene los huevos parejos; también sirve para pancakes. Antiadherente y fácil de limpiar.</p>' WHERE id=93;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=93;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('7 divisiones: desayuno para toda la familia',93,0,true,now()),('Huevos parejos, cada uno en su lugar',93,1,true,now()),('Antiadherente: usa poco aceite',93,2,true,now()),('Fácil de limpiar',93,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=93;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Divisiones','7',93,0,true,now()),('Recubrimiento','Antiadherente',93,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Juego de 3 sartenes tamaño grande</strong> para equipar tu cocina con lo esencial. Antiadherentes, resistentes y cómodos de manejar para freír, saltear y dorar tus recetas favoritas. Fáciles de lavar.</p>' WHERE id=19;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=19;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Juego de 3 sartenes grandes',19,0,true,now()),('Antiadherentes: usan poco aceite',19,1,true,now()),('Resistentes y cómodos de manejar',19,2,true,now()),('Fáciles de lavar',19,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=19;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Piezas','3 sartenes',19,0,true,now()),('Tamaño','Grande',19,1,true,now()),('Recubrimiento','Antiadherente',19,2,true,now());

UPDATE "Inventory" SET description='<p><strong>Juego de 3 sartenes tamaño mediano</strong>, prácticos para el día a día. Antiadherentes y resistentes, ideales para freír, saltear y preparar de todo con poco aceite. Fáciles de lavar y guardar.</p>' WHERE id=20;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=20;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Juego de 3 sartenes medianos',20,0,true,now()),('Antiadherentes: usan poco aceite',20,1,true,now()),('Prácticos para el día a día',20,2,true,now()),('Fáciles de lavar y guardar',20,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=20;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Piezas','3 sartenes',20,0,true,now()),('Tamaño','Mediano',20,1,true,now()),('Recubrimiento','Antiadherente',20,2,true,now());

UPDATE "Inventory" SET description='<p>Fríe con poco o nada de aceite y come más sano con la <strong>freidora de aire de 8 litros</strong>. Gran capacidad para preparar papas, pollo, verduras y postres de forma rápida y sin grasa. Fácil de usar y de limpiar.</p>' WHERE id=156;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=156;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Fríe con poco o nada de aceite',156,0,true,now()),('Gran capacidad de 8 litros',156,1,true,now()),('Papas, pollo, verduras y postres',156,2,true,now()),('Fácil de usar y limpiar',156,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=156;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Capacidad','8 litros',156,0,true,now()),('Tipo','Freidora de aire',156,1,true,now()),('Uso','Freír sin aceite',156,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>freidora de aire Schaffhausen de 12 litros</strong> es ideal para familias grandes o para preparar varias cosas a la vez. Cocina y fríe con poco aceite, de forma más sana, rápida y sin humo. Fácil de usar y limpiar.</p>' WHERE id=364;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=364;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran capacidad de 12 litros',364,0,true,now()),('Fríe con poco aceite, más sano',364,1,true,now()),('Ideal para familias grandes',364,2,true,now()),('Sin humo y fácil de limpiar',364,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=364;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / línea','Schaffhausen',364,0,true,now()),('Capacidad','12 litros',364,1,true,now()),('Tipo','Freidora de aire',364,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>freidora de aire Schaffhausen de 8 litros</strong> te deja disfrutar papas, pollo y más con poco o nada de aceite. Práctica y de buena capacidad para el día a día, cocina rápido, sin humo y de forma más saludable.</p>' WHERE id=82;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=82;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Capacidad de 8 litros',82,0,true,now()),('Fríe con poco o nada de aceite',82,1,true,now()),('Cocina rápido y sin humo',82,2,true,now()),('Fácil de usar y limpiar',82,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=82;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / línea','Schaffhausen',82,0,true,now()),('Capacidad','8 litros',82,1,true,now()),('Tipo','Freidora de aire',82,2,true,now());
