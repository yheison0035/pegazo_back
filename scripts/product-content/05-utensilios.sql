-- ============================================================================
-- Contenido · UTENSILIOS DE COCINA (29). Descripción + características + specs.
-- Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Prepara un café cremoso como el de la cafetería con el <strong>batidor de leche eléctrico</strong>. Genera espuma suave para capuchinos, chocolates y malteadas en segundos. Compacto, práctico y fácil de lavar.</p>' WHERE id=127;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=127;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hace espuma cremosa en segundos',127,0,true,now()),('Ideal para capuchinos, chocolate y malteadas',127,1,true,now()),('Compacto y liviano',127,2,true,now()),('Fácil de lavar',127,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=127;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Batidor / espumador',127,0,true,now()),('Alimentación','Pilas',127,1,true,now());

UPDATE "Inventory" SET description='<p>Corta verduras en láminas, tiras y cubos perfectos con la <strong>mandolina cortadora</strong>. Ahorra tiempo y logra cortes parejos para ensaladas, sofritos y decoraciones. Incluye cuchillas y protector para tus manos.</p>' WHERE id=131;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=131;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cortes en láminas, tiras y cubos',131,0,true,now()),('Cortes parejos y rápidos',131,1,true,now()),('Incluye protector de mano',131,2,true,now()),('Fácil de lavar',131,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=131;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mandolina cortadora',131,0,true,now()),('Uso','Verduras y frutas',131,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de cuchillos Heesem</strong> reúne los cuchillos esenciales para tu cocina: carnes, verduras, pan y más. Hojas filosas de acero inoxidable con mangos cómodos y resistentes. Un básico de calidad para el día a día.</p>' WHERE id=35;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=35;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hojas filosas de acero inoxidable',35,0,true,now()),('Cuchillos para carnes, verduras y pan',35,1,true,now()),('Mangos cómodos y resistentes',35,2,true,now()),('Marca Heesem',35,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=35;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Heesem',35,0,true,now()),('Material','Acero inoxidable',35,1,true,now());

UPDATE "Inventory" SET description='<p>Sirve agua sin levantar el botellón con el <strong>dispensador de agua para botellón</strong>. Bomba práctica que se adapta a cualquier garrafa y saca el agua con solo presionar. Recargable y cómodo para casa u oficina.</p>' WHERE id=27;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=27;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Saca agua del botellón con un botón',27,0,true,now()),('Se adapta a cualquier garrafa',27,1,true,now()),('Recargable por USB',27,2,true,now()),('Práctico para casa u oficina',27,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=27;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Dispensador / bomba de agua',27,0,true,now()),('Alimentación','Recargable por USB',27,1,true,now());

UPDATE "Inventory" SET description='<p>Prepara deliciosas donas en casa con esta <strong>máquina para donas</strong> que hace hasta 7 unidades a la vez. Calienta rápido, con placas antiadherentes para donas doraditas y parejas. Fácil de usar y de limpiar.</p>' WHERE id=136;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=136;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hace hasta 7 donas a la vez',136,0,true,now()),('Placas antiadherentes',136,1,true,now()),('Calienta rápido',136,2,true,now()),('Fácil de usar y limpiar',136,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=136;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Máquina de donas',136,0,true,now()),('Capacidad','7 donas',136,1,true,now()),('Placa','Antiadherente',136,2,true,now());

UPDATE "Inventory" SET description='<p>Agua más limpia y con mejor sabor con el <strong>filtro purificador de agua de 14 litros</strong>. Retiene impurezas y sedimentos para que toda la familia tome agua más pura. Gran capacidad, ideal para la cocina del hogar.</p>' WHERE id=31;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=31;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran capacidad de 14 litros',31,0,true,now()),('Retiene impurezas y sedimentos',31,1,true,now()),('Mejora el sabor del agua',31,2,true,now()),('Ideal para toda la familia',31,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=31;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Filtro purificador',31,0,true,now()),('Capacidad','14 litros',31,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>filtro de agua para llave (mediano)</strong> se instala en tu grifo y reduce impurezas para un agua más limpia al momento. Fácil de poner, práctico y económico para el día a día.</p>' WHERE id=23;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=23;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Se instala directo en la llave',23,0,true,now()),('Reduce impurezas del agua',23,1,true,now()),('Tamaño mediano',23,2,true,now()),('Fácil de instalar',23,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=23;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Filtro para llave',23,0,true,now()),('Tamaño','Mediano',23,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>filtro de agua para llave (pequeño)</strong> es la opción compacta para reducir impurezas directamente en tu grifo. Práctico, económico y fácil de instalar en la cocina.</p>' WHERE id=22;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=22;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Se instala directo en la llave',22,0,true,now()),('Reduce impurezas del agua',22,1,true,now()),('Tamaño pequeño y compacto',22,2,true,now()),('Fácil de instalar',22,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=22;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Filtro para llave',22,0,true,now()),('Tamaño','Pequeño',22,1,true,now());

UPDATE "Inventory" SET description='<p>Huevos duros perfectos y sin vigilar la olla con la <strong>hervidora de huevos con forma de gallina</strong>. Cocina varios huevos al vapor y se apaga sola. Divertida, práctica y fácil de limpiar.</p>' WHERE id=133;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=133;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cocina varios huevos al vapor',133,0,true,now()),('Diseño divertido de gallina',133,1,true,now()),('Apagado automático',133,2,true,now()),('Fácil de usar y limpiar',133,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=133;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hervidora de huevos',133,0,true,now()),('Función','Apagado automático',133,1,true,now());

UPDATE "Inventory" SET description='<p>Los <strong>cuchillos tipo hacha japonesa</strong> son ideales para cortar carnes, huesos y verduras duras con facilidad. Hoja ancha y filosa en acero inoxidable con mango cómodo y firme. Resistentes y de gran presencia en tu cocina.</p>' WHERE id=85;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=85;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hoja ancha y filosa para cortes exigentes',85,0,true,now()),('Ideal para carnes, huesos y verduras duras',85,1,true,now()),('Acero inoxidable resistente',85,2,true,now()),('Mango cómodo y firme',85,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=85;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cuchillo hacha (estilo japonés)',85,0,true,now()),('Material','Acero inoxidable',85,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>kit de cocina en silicona</strong> trae los utensilios esenciales que no rayan tus ollas: espátulas, cucharón, pinzas y más. Silicona resistente al calor, higiénica y fácil de lavar. Colores modernos para tu cocina.</p>' WHERE id=141;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=141;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Utensilios de silicona que no rayan',141,0,true,now()),('Resistentes al calor',141,1,true,now()),('Higiénicos y fáciles de lavar',141,2,true,now()),('Kit completo para cocinar',141,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=141;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Silicona',141,0,true,now()),('Tipo','Kit de utensilios',141,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>licuadora sencilla</strong> es tu aliada de todos los días para jugos, batidos y salsas. Motor confiable y cuchillas de acero que trituran frutas y hielo. Práctica, resistente y fácil de lavar.</p>' WHERE id=117;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=117;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Para jugos, batidos y salsas',117,0,true,now()),('Cuchillas de acero que trituran hielo',117,1,true,now()),('Motor confiable',117,2,true,now()),('Fácil de lavar',117,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=117;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Licuadora',117,0,true,now()),('Cuchillas','Acero inoxidable',117,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>machacador de ajo 2 en 1</strong> tritura y pela el ajo sin ensuciarte las manos. Práctico y rápido, también sirve para jengibre y otros aliños. Fácil de lavar y guardar.</p>' WHERE id=124;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=124;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tritura y pela el ajo (2 en 1)',124,0,true,now()),('También para jengibre y aliños',124,1,true,now()),('No deja olor en las manos',124,2,true,now()),('Fácil de lavar',124,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=124;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Machacador de ajo 2 en 1',124,0,true,now()),('Uso','Ajo, jengibre, aliños',124,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>machacador de ajo sencillo</strong> tritura el ajo en segundos para tus preparaciones. Práctico, resistente y fácil de lavar; un básico que no puede faltar en tu cocina.</p>' WHERE id=125;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=125;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tritura el ajo en segundos',125,0,true,now()),('Práctico y resistente',125,1,true,now()),('Fácil de lavar',125,2,true,now()),('Un básico de cocina',125,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=125;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Machacador de ajo',125,0,true,now()),('Uso','Ajo y aliños',125,1,true,now());

UPDATE "Inventory" SET description='<p>Consiente a los tuyos con <strong>mini donas</strong> caseras. Esta máquina hace varias donas pequeñas a la vez, doraditas y parejas gracias a sus placas antiadherentes. Calienta rápido y es muy fácil de usar y limpiar.</p>' WHERE id=135;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=135;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Hace varias mini donas a la vez',135,0,true,now()),('Placas antiadherentes',135,1,true,now()),('Calienta rápido',135,2,true,now()),('Fácil de usar y limpiar',135,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=135;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Máquina de mini donas',135,0,true,now()),('Placa','Antiadherente',135,1,true,now());

UPDATE "Inventory" SET description='<p>Waffles caseros en minutos con la <strong>mini waflera</strong>. Compacta y fácil de usar, hace waffles doraditos con su placa antiadherente. Perfecta para desayunos y onces. Fácil de guardar.</p>' WHERE id=48;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=48;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Waffles doraditos en minutos',48,0,true,now()),('Placa antiadherente',48,1,true,now()),('Compacta y fácil de guardar',48,2,true,now()),('Ideal para desayunos y onces',48,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=48;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini waflera',48,0,true,now()),('Placa','Antiadherente',48,1,true,now());

UPDATE "Inventory" SET description='<p>Muele tu carne en casa con el <strong>molino de carne manual</strong>. Con solo girar la manija procesas carne para hamburguesas, albóndigas y rellenos; también sirve para embutidos. Resistente y fácil de lavar.</p>' WHERE id=140;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=140;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Muele carne girando la manija',140,0,true,now()),('Ideal para hamburguesas y albóndigas',140,1,true,now()),('También para embutidos',140,2,true,now()),('Resistente y fácil de lavar',140,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=140;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Molino de carne manual',140,0,true,now()),('Uso','Carne y embutidos',140,1,true,now());

UPDATE "Inventory" SET description='<p>Mantén tu despensa ordenada con el <strong>organizador dispensador de granos</strong>. Guarda cereales, granos y snacks, y los sirve fácil con su dosificador. Hermético para conservar mejor y ahorrar espacio.</p>' WHERE id=137;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=137;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Dosifica granos, cereales y snacks',137,0,true,now()),('Cierre hermético para conservar mejor',137,1,true,now()),('Ordena y ahorra espacio',137,2,true,now()),('Fácil de limpiar',137,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=137;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Dispensador de granos',137,0,true,now()),('Uso','Cereales, granos, snacks',137,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>picatodo 15 en 1</strong> corta, pica, ralla y rebana de mil formas con sus accesorios. Prepara ensaladas, sofritos y guarniciones en menos tiempo, sin electricidad. Práctico, completo y fácil de lavar.</p>' WHERE id=40;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=40;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('15 funciones: corta, pica, ralla y rebana',40,0,true,now()),('Múltiples accesorios incluidos',40,1,true,now()),('No necesita electricidad',40,2,true,now()),('Fácil de lavar',40,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=40;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Picatodo manual',40,0,true,now()),('Funciones','15 en 1',40,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>picatodo eléctrico</strong> tritura verduras, carnes y aliños en segundos con solo un botón. Motor potente y cuchillas de acero para preparar tus recetas más rápido. Práctico y fácil de limpiar.</p>' WHERE id=138;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=138;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pica verduras, carnes y aliños en segundos',138,0,true,now()),('Motor potente con cuchillas de acero',138,1,true,now()),('Funciona con un botón',138,2,true,now()),('Fácil de limpiar',138,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=138;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Picatodo eléctrico',138,0,true,now()),('Cuchillas','Acero inoxidable',138,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>picatodo manual tipo yoyo</strong> pica verduras y aliños tirando de su cuerda, sin electricidad. Rápido y divertido de usar, ideal para cebolla, ajo y hierbas. Compacto y fácil de lavar.</p>' WHERE id=128;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=128;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pica tirando de la cuerda (tipo yoyo)',128,0,true,now()),('No necesita electricidad',128,1,true,now()),('Ideal para cebolla, ajo y hierbas',128,2,true,now()),('Compacto y fácil de lavar',128,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=128;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Picatodo manual (yoyo)',128,0,true,now()),('Uso','Verduras y aliños',128,1,true,now());

UPDATE "Inventory" SET description='<p>Lleva tu almuerzo caliente a donde vayas con el <strong>portacomidas eléctrico</strong>. Conéctalo a la corriente o al carro y calienta tus alimentos, ideal para el trabajo o los viajes. Sellado, práctico y fácil de transportar.</p>' WHERE id=8;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=8;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Calienta tu comida donde estés',8,0,true,now()),('Se conecta a la corriente o al carro',8,1,true,now()),('Cierre sellado para transportar',8,2,true,now()),('Ideal para trabajo y viajes',8,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=8;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Portacomidas eléctrico',8,0,true,now()),('Uso','Trabajo / viajes',8,1,true,now());

UPDATE "Inventory" SET description='<p>Disfruta un café de sabor intenso con la <strong>prensa francesa de 600 ml</strong>. Prepara café filtrado sin cápsulas ni electricidad: solo agrega café, agua caliente y presiona. También sirve para infusiones. Elegante y fácil de lavar.</p>' WHERE id=115;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=115;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Café filtrado sin cápsulas ni electricidad',115,0,true,now()),('Capacidad de 600 ml',115,1,true,now()),('También para infusiones y té',115,2,true,now()),('Elegante y fácil de lavar',115,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=115;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Prensa francesa',115,0,true,now()),('Capacidad','600 ml',115,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Repuesto de filtro de agua</strong> para mantener tu purificador funcionando al máximo. Renueva el filtro periódicamente para conservar agua limpia y de buen sabor.</p>' WHERE id=30;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=30;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Mantiene el agua limpia y con buen sabor',30,0,true,now()),('Fácil de reemplazar',30,1,true,now()),('Prolonga la vida útil del purificador',30,2,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=30;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Repuesto de filtro',30,0,true,now());

UPDATE "Inventory" SET description='<p><strong>Repuesto de filtro de agua (mediano)</strong> para tu filtro de llave. Cámbialo cuando lo necesites para seguir reduciendo impurezas y disfrutar de agua más limpia.</p>' WHERE id=21;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=21;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Repuesto para filtro de llave mediano',21,0,true,now()),('Reduce impurezas del agua',21,1,true,now()),('Fácil de reemplazar',21,2,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=21;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Repuesto de filtro',21,0,true,now()),('Tamaño','Mediano',21,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Repuesto de llave para filtro de agua de 14 litros</strong>. Recambia la llave de tu filtro para que siga sirviendo agua sin goteos ni fallas. Fácil de instalar.</p>' WHERE id=28;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=28;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Repuesto de llave para filtro de 14 L',28,0,true,now()),('Evita goteos y fallas',28,1,true,now()),('Fácil de instalar',28,2,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=28;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Repuesto de llave',28,0,true,now()),('Compatible','Filtro 14 litros',28,1,true,now());

UPDATE "Inventory" SET description='<p>Conserva tus alimentos frescos por más tiempo con la <strong>selladora al vacío</strong>. Extrae el aire de las bolsas para evitar que la comida se dañe, ideal para carnes, verduras y sobras. Ahorra dinero y espacio en la nevera.</p>' WHERE id=129;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=129;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Conserva los alimentos frescos por más tiempo',129,0,true,now()),('Extrae el aire y sella las bolsas',129,1,true,now()),('Ideal para carnes, verduras y sobras',129,2,true,now()),('Ahorra dinero y espacio',129,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=129;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Selladora al vacío',129,0,true,now()),('Uso','Conservación de alimentos',129,1,true,now());

UPDATE "Inventory" SET description='<p>Cocina más sano usando menos aceite con el <strong>spray rociador de aceite</strong>. Rocía una capa fina y pareja sobre sartenes, ensaladas o parrillas. Rellenable con tu aceite preferido y fácil de usar.</p>' WHERE id=126;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=126;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Rocía una capa fina de aceite',126,0,true,now()),('Ayuda a usar menos aceite',126,1,true,now()),('Rellenable con tu aceite preferido',126,2,true,now()),('Ideal para sartenes, ensaladas y parrilla',126,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=126;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Rociador de aceite',126,0,true,now()),('Uso','Cocina saludable',126,1,true,now());

UPDATE "Inventory" SET description='<p>Descongela tus alimentos más rápido y sin electricidad con la <strong>tabla descongeladora</strong>. Su material conduce el calor natural para descongelar carnes en menos tiempo, de forma segura. Práctica y fácil de lavar.</p>' WHERE id=132;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=132;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Descongela más rápido sin electricidad',132,0,true,now()),('Conduce el calor natural del ambiente',132,1,true,now()),('Segura para tus alimentos',132,2,true,now()),('Práctica y fácil de lavar',132,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=132;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Tabla descongeladora',132,0,true,now()),('Uso','Descongelar carnes',132,1,true,now());
