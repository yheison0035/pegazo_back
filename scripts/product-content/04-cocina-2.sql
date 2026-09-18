-- ============================================================================
-- Contenido · COCINA (tanda 2: licuadoras, exprimidores, molinos, wafleras,
-- picadores, sacacorchos, cubiertos decorativos). Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Disfruta jugo de naranja recién exprimido con este <strong>exprimidor de naranja</strong>. Práctico y fácil de usar, saca todo el jugo de cítricos sin complicaciones. Ideal para tus desayunos en casa.</p>' WHERE id=119;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=119;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Saca todo el jugo de naranjas y cítricos',119,0,true,now()),('Práctico y fácil de usar',119,1,true,now()),('Ideal para tus desayunos',119,2,true,now()),('Fácil de lavar',119,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=119;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Exprimidor de cítricos',119,0,true,now()),('Uso','Jugo de naranja / limón',119,1,true,now());

UPDATE "Inventory" SET description='<p>Prepara jugos naturales en segundos con el <strong>extractor de jugo eléctrico</strong>. Extrae el jugo de frutas y verduras dejando la pulpa aparte, para bebidas más puras y saludables. Potente, práctico y fácil de limpiar.</p>' WHERE id=130;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=130;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Extrae el jugo separando la pulpa',130,0,true,now()),('Para frutas y verduras',130,1,true,now()),('Motor potente y rápido',130,2,true,now()),('Fácil de desarmar y limpiar',130,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=130;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Extractor de jugo eléctrico',130,0,true,now()),('Uso','Frutas y verduras',130,1,true,now());

UPDATE "Inventory" SET description='<p>Sorprende en tus reuniones con la <strong>fuente de chocolate</strong>. Derrite el chocolate y lo hace caer en cascada para bañar fresas, marshmallows y frutas. Ideal para fiestas, cumpleaños y celebraciones.</p>' WHERE id=123;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=123;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cascada de chocolate para mojar frutas y dulces',123,0,true,now()),('Perfecta para fiestas y celebraciones',123,1,true,now()),('Fácil de usar',123,2,true,now()),('Un detalle que sorprende a los invitados',123,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=123;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Fuente de chocolate',123,0,true,now()),('Uso','Fiestas / postres',123,1,true,now());

UPDATE "Inventory" SET description='<p>Agua caliente en minutos con el <strong>hervidor de agua eléctrico</strong>. Ideal para café, aromáticas, té o preparaciones rápidas. Se apaga solo al hervir y es seguro y fácil de usar.</p>' WHERE id=118;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=118;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Calienta el agua en minutos',118,0,true,now()),('Apagado automático al hervir',118,1,true,now()),('Ideal para café, té y aromáticas',118,2,true,now()),('Seguro y fácil de usar',118,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=118;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hervidor eléctrico',118,0,true,now()),('Función','Apagado automático',118,1,true,now());

UPDATE "Inventory" SET description='<p>Organiza y luce tus huevos con este <strong>centro de mesa en forma de esfera</strong>. Un detalle decorativo y práctico para la cocina o el comedor que mantiene los huevos ordenados y a la vista.</p>' WHERE id=431;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=431;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Organiza los huevos de forma ordenada',431,0,true,now()),('Diseño esférico decorativo',431,1,true,now()),('Práctico para cocina o comedor',431,2,true,now()),('Fácil de limpiar',431,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=431;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Centro de mesa / organizador',431,0,true,now()),('Uso','Huevos',431,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Juego de cubiertos con base decorativa en forma de huevo</strong>. Además de servir tus comidas, la base funciona como centro de mesa elegante para la cocina o el comedor. Cubiertos en acero inoxidable, resistentes y fáciles de lavar.</p>' WHERE id=34;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=34;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Base decorativa en forma de huevo (centro de mesa)',34,0,true,now()),('Cubiertos en acero inoxidable',34,1,true,now()),('Set completo para la mesa',34,2,true,now()),('Resistentes y fáciles de lavar',34,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=34;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero inoxidable',34,0,true,now()),('Incluye','Juego de cubiertos + base',34,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>kit de espátulas de silicona de 12 piezas</strong> trae todo lo que necesitas para cocinar: espátulas, cucharones, batidor y más. Silicona resistente al calor que no raya tus ollas y se limpia fácil.</p>' WHERE id=405;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=405;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Kit completo de 12 piezas',405,0,true,now()),('Silicona resistente al calor',405,1,true,now()),('No raya ollas ni sartenes',405,2,true,now()),('Fácil de lavar',405,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=405;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Silicona',405,0,true,now()),('Piezas','12',405,1,true,now());

UPDATE "Inventory" SET description='<p>Aprovecha al máximo tu freidora de aire con el <strong>kit de silicona para freidora</strong>. Incluye moldes y accesorios de silicona resistente al calor para hornear, cocinar y limpiar más fácil, sin rayar la canasta.</p>' WHERE id=421;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=421;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Moldes y accesorios para freidora de aire',421,0,true,now()),('Silicona resistente al calor',421,1,true,now()),('No raya la canasta y facilita la limpieza',421,2,true,now()),('Amplía lo que puedes cocinar',421,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=421;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Silicona',421,0,true,now()),('Compatible','Freidora de aire',421,1,true,now());

UPDATE "Inventory" SET name='LICUADORA ELECTRICA DOBLE VASO', description='<p>La <strong>licuadora eléctrica de doble vaso</strong> te da dos vasos para preparar jugos, batidos y salsas y llevarlos donde quieras. Motor potente con cuchillas de acero que trituran hielo y frutas con facilidad.</p>' WHERE id=121;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=121;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Incluye dos vasos para llevar',121,0,true,now()),('Motor potente con cuchillas de acero',121,1,true,now()),('Tritura hielo y frutas fácilmente',121,2,true,now()),('Para jugos, batidos y salsas',121,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=121;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Licuadora eléctrica',121,0,true,now()),('Vasos','2',121,1,true,now()),('Cuchillas','Acero inoxidable',121,2,true,now());

UPDATE "Inventory" SET description='<p>Prepara tus batidos donde estés con la <strong>licuadora portátil de doble vaso</strong>. Recargable por USB, la llevas al trabajo, al gimnasio o de viaje. Cuchillas de acero para frutas y hielo, y dos vasos prácticos.</p>' WHERE id=122;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=122;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Portátil y recargable por USB',122,0,true,now()),('Incluye dos vasos para llevar',122,1,true,now()),('Cuchillas de acero para frutas y hielo',122,2,true,now()),('Ideal para gimnasio, trabajo o viaje',122,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=122;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Licuadora portátil',122,0,true,now()),('Vasos','2',122,1,true,now()),('Alimentación','Recargable por USB',122,2,true,now());

UPDATE "Inventory" SET description='<p>Waffles tiernos con forma de corazón para consentir a los tuyos. La <strong>mini waflera de corazón</strong> calienta rápido y hace waffles perfectos en minutos. Antiadherente, compacta y fácil de usar y guardar.</p>' WHERE id=391;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=391;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Waffles con forma de corazón',391,0,true,now()),('Calienta rápido: listos en minutos',391,1,true,now()),('Placa antiadherente',391,2,true,now()),('Compacta y fácil de guardar',391,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=391;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini waflera',391,0,true,now()),('Forma','Corazón',391,1,true,now()),('Placa','Antiadherente',391,2,true,now());

UPDATE "Inventory" SET description='<p>Café recién molido en casa con el <strong>molino de café eléctrico</strong>. Muele los granos en segundos para un café más aromático y fresco; también sirve para especias y semillas. Compacto, potente y fácil de limpiar.</p>' WHERE id=434;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=434;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Muele café en segundos',434,0,true,now()),('También para especias y semillas',434,1,true,now()),('Café más fresco y aromático',434,2,true,now()),('Compacto y fácil de limpiar',434,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=434;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Molino de café eléctrico',434,0,true,now()),('Uso','Café, especias, semillas',434,1,true,now());

UPDATE "Inventory" SET description='<p>Pica y muele tus verduras sin electricidad con el <strong>molino manual de verduras</strong>. Con solo girar la manija procesas cebolla, ajo, tomate y más en segundos. Práctico, resistente y fácil de lavar.</p>' WHERE id=139;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=139;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pica verduras girando la manija',139,0,true,now()),('No necesita electricidad',139,1,true,now()),('Para cebolla, ajo, tomate y más',139,2,true,now()),('Resistente y fácil de lavar',139,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=139;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Molino / picador manual',139,0,true,now()),('Uso','Verduras',139,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>picadora eléctrica Sokany</strong> tritura verduras, carnes, ajo y más en segundos con solo un botón. Motor potente y cuchillas de acero para preparar tus recetas más rápido. Práctica y fácil de limpiar.</p>' WHERE id=800;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=800;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Pica verduras, carnes y ajo en segundos',800,0,true,now()),('Motor potente con cuchillas de acero',800,1,true,now()),('Funciona con un botón',800,2,true,now()),('Fácil de limpiar',800,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=800;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Sokany',800,0,true,now()),('Tipo','Picadora eléctrica',800,1,true,now()),('Cuchillas','Acero inoxidable',800,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>picadora recargable</strong> tritura verduras, carnes y ajo sin cables. Recargable por USB para usarla donde quieras, con cuchillas de acero que pican en segundos. Compacta, práctica y fácil de lavar.</p>' WHERE id=392;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=392;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Recargable por USB: sin cables',392,0,true,now()),('Pica verduras, carnes y ajo en segundos',392,1,true,now()),('Cuchillas de acero inoxidable',392,2,true,now()),('Compacta y fácil de lavar',392,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=392;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Picadora recargable',392,0,true,now()),('Alimentación','Recargable por USB',392,1,true,now()),('Cuchillas','Acero inoxidable',392,2,true,now());

UPDATE "Inventory" SET description='<p><strong>Juego de cubiertos con base decorativa en forma de piña</strong>. Un centro de mesa elegante que además guarda tus cubiertos de acero inoxidable. Ideal para lucir en la cocina o el comedor y sorprender a tus invitados.</p>' WHERE id=404;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=404;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Base decorativa en forma de piña (centro de mesa)',404,0,true,now()),('Cubiertos en acero inoxidable',404,1,true,now()),('Set completo para la mesa',404,2,true,now()),('Resistentes y fáciles de lavar',404,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=404;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Acero inoxidable',404,0,true,now()),('Incluye','Juego de cubiertos + base',404,1,true,now());

UPDATE "Inventory" SET description='<p>Lleva tu comida caliente a donde vayas con el <strong>portacomidas eléctrico</strong>. Calienta tus alimentos conectándolo a la corriente o al carro, ideal para el trabajo o los viajes. Práctico, sellado y fácil de transportar.</p>' WHERE id=116;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=116;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Calienta tu comida donde estés',116,0,true,now()),('Ideal para el trabajo o los viajes',116,1,true,now()),('Cierre sellado para transportar',116,2,true,now()),('Fácil de lavar',116,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=116;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Portacomidas eléctrico',116,0,true,now()),('Material','Plástico',116,1,true,now()),('Uso','Trabajo / viajes',116,2,true,now());

UPDATE "Inventory" SET description='<p>Abre tus botellas de vino sin esfuerzo con el <strong>sacacorchos eléctrico a pilas</strong>. Retira el corcho en segundos con solo presionar un botón, sin fuerza ni corchos rotos. Elegante y fácil de usar.</p>' WHERE id=168;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=168;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Retira el corcho en segundos con un botón',168,0,true,now()),('Sin esfuerzo ni corchos rotos',168,1,true,now()),('Funciona con pilas',168,2,true,now()),('Elegante y fácil de usar',168,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=168;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Sacacorchos eléctrico',168,0,true,now()),('Alimentación','Pilas',168,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>sacacorchos eléctrico recargable</strong> abre tus botellas de vino de forma rápida y elegante. Recargable por USB, retira el corcho con solo un botón, sin fuerza. Perfecto para reuniones y para lucir en tu mesa.</p>' WHERE id=169;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=169;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Retira el corcho con un botón, sin fuerza',169,0,true,now()),('Recargable por USB',169,1,true,now()),('Rápido y elegante',169,2,true,now()),('Ideal para reuniones',169,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=169;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Sacacorchos eléctrico',169,0,true,now()),('Alimentación','Recargable por USB',169,1,true,now());
