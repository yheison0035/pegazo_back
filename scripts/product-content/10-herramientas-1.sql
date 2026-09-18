-- ============================================================================
-- Contenido · HERRAMIENTAS (tanda 1 de 2). Descripción + características + specs.
-- Idempotente. No se cambian nombres.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Mantén tu carro impecable con la <strong>aspiradora para carro</strong>. Potente y compacta, aspira polvo, migas y suciedad de asientos, tapetes y rincones. Se conecta al encendedor del vehículo y trae boquillas para llegar a todos lados.</p>' WHERE id=108;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=108;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Aspira polvo, migas y suciedad del carro',108,0,true,now()),('Se conecta al encendedor del vehículo',108,1,true,now()),('Boquillas para rincones difíciles',108,2,true,now()),('Compacta y fácil de guardar',108,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=108;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Aspiradora de carro',108,0,true,now()),('Alimentación','12V (encendedor)',108,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>aspiradora y sopladora 48V</strong> aspira y sopla para limpiar el carro, el taller o los rincones de la casa. Inalámbrica y recargable, con buena potencia y liviana para usar donde quieras.</p>' WHERE id=111;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=111;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: aspira y sopla',111,0,true,now()),('Inalámbrica y recargable (48V)',111,1,true,now()),('Ideal para carro, taller y casa',111,2,true,now()),('Liviana y potente',111,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=111;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Aspiradora / sopladora',111,0,true,now()),('Batería','48V recargable',111,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>sopladora y aspiradora 56V</strong> combina más potencia para limpiar hojas, polvo y suciedad en patios, garajes y talleres. Inalámbrica y recargable, cambia fácil entre soplar y aspirar.</p>' WHERE id=104;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=104;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: sopla y aspira con potencia',104,0,true,now()),('Inalámbrica y recargable (56V)',104,1,true,now()),('Ideal para patios, garajes y talleres',104,2,true,now()),('Cambio fácil entre funciones',104,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=104;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Sopladora / aspiradora',104,0,true,now()),('Batería','56V recargable',104,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>soplador FS19</strong> es liviano y potente para limpiar hojas, polvo y recortes en patios y garajes. Inalámbrico y recargable, práctico para tener siempre a mano en tu jardín o taller.</p>' WHERE id=110;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=110;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sopla hojas, polvo y recortes',110,0,true,now()),('Liviano y potente',110,1,true,now()),('Inalámbrico y recargable',110,2,true,now()),('Ideal para patio y garaje',110,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=110;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','FS19',110,0,true,now()),('Tipo','Soplador',110,1,true,now()),('Alimentación','Recargable',110,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>compresor de aire de dos cilindros</strong> entrega más potencia y aire para inflar, pintar o usar herramientas neumáticas. Robusto y de buena capacidad, ideal para taller o uso exigente.</p>' WHERE id=361;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=361;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Dos cilindros: más potencia y aire',361,0,true,now()),('Para inflar, pintar y herramientas neumáticas',361,1,true,now()),('Robusto y de buena capacidad',361,2,true,now()),('Ideal para taller',361,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=361;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Compresor de aire',361,0,true,now()),('Cilindros','2',361,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>mini compresor de aire portátil</strong> infla llantas de carro, moto y bicicleta donde estés. Compacto y fácil de guardar, se conecta al vehículo y muestra la presión para inflar a la medida exacta.</p>' WHERE id=109;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=109;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Infla llantas de carro, moto y bici',109,0,true,now()),('Compacto y portátil',109,1,true,now()),('Muestra la presión (PSI)',109,2,true,now()),('Ideal para emergencias en carretera',109,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=109;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini compresor de aire',109,0,true,now()),('Uso','Inflar llantas',109,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>compresor de aire de cilindro</strong> es tu aliado para inflar, pintar o usar herramientas neumáticas en casa o el taller. Buena potencia y capacidad, resistente y fácil de usar.</p>' WHERE id=357;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=357;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Para inflar, pintar y herramientas neumáticas',357,0,true,now()),('Buena potencia y capacidad',357,1,true,now()),('Resistente y duradero',357,2,true,now()),('Ideal para casa o taller',357,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=357;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Compresor de aire',357,0,true,now()),('Cilindros','1',357,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>hidrolavadora portátil 56V</strong> lava tu carro, moto, patio o fachada con agua a presión, sin necesidad de toma de agua fija: succiona desde un balde. Inalámbrica y recargable, ideal para limpiar donde quieras.</p>' WHERE id=402;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=402;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agua a presión sin toma fija (usa un balde)',402,0,true,now()),('Inalámbrica y recargable (56V)',402,1,true,now()),('Lava carro, moto, patio y fachada',402,2,true,now()),('Portátil y fácil de usar',402,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=402;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hidrolavadora portátil',402,0,true,now()),('Batería','56V recargable',402,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>hidrolavadora portátil 56V con punta de 6 chorros</strong> lava a presión y te deja elegir el tipo de chorro para cada superficie. Inalámbrica y recargable, succiona el agua desde un balde para usarla en cualquier lado.</p>' WHERE id=7;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=7;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Punta de 6 chorros ajustables',7,0,true,now()),('Agua a presión sin toma fija (usa un balde)',7,1,true,now()),('Inalámbrica y recargable (56V)',7,2,true,now()),('Lava carro, moto, patio y fachada',7,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=7;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hidrolavadora portátil',7,0,true,now()),('Batería','56V recargable',7,1,true,now()),('Incluye','Punta de 6 chorros',7,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>hidrolavadora portátil 96V con 6 chorros</strong> ofrece máxima potencia para la suciedad más difícil. Inalámbrica y recargable, con punta de 6 chorros y succión desde balde para lavar carro, moto, patios y fachadas donde estés.</p>' WHERE id=799;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=799;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Máxima potencia (96V)',799,0,true,now()),('Punta de 6 chorros ajustables',799,1,true,now()),('Agua a presión sin toma fija (usa un balde)',799,2,true,now()),('Inalámbrica y recargable',799,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=799;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hidrolavadora portátil',799,0,true,now()),('Batería','96V recargable',799,1,true,now()),('Incluye','Punta de 6 chorros',799,2,true,now());

UPDATE "Inventory" SET description='<p><strong>Punta de 6 chorros para hidrolavadora</strong>: accesorio de repuesto que te deja elegir el tipo de chorro según la superficie, desde suave hasta concentrado. Fácil de acoplar para sacarle el máximo provecho a tu hidrolavadora.</p>' WHERE id=166;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=166;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('6 tipos de chorro para cada superficie',166,0,true,now()),('Repuesto/accesorio para hidrolavadora',166,1,true,now()),('Fácil de acoplar',166,2,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=166;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Punta / boquilla',166,0,true,now()),('Chorros','6',166,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>iniciador de batería</strong> arranca tu carro cuando la batería se descarga, sin necesidad de otro vehículo. Compacto y recargable, también sirve como power bank para cargar el celular. Un salvavidas para llevar siempre en el carro.</p>' WHERE id=105;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=105;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Arranca el carro sin otro vehículo',105,0,true,now()),('También sirve como power bank',105,1,true,now()),('Compacto y recargable',105,2,true,now()),('Ideal para emergencias',105,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=105;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Iniciador de batería (jump starter)',105,0,true,now()),('Extra','Power bank USB',105,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>iniciador de batería con compresor</strong> es 2 en 1: arranca tu carro cuando se descarga la batería e infla las llantas gracias a su compresor integrado. Recargable y con power bank, la herramienta ideal para emergencias en carretera.</p>' WHERE id=102;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=102;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: arranca el carro e infla llantas',102,0,true,now()),('Compresor de aire integrado',102,1,true,now()),('También sirve como power bank',102,2,true,now()),('Recargable, ideal para emergencias',102,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=102;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Iniciador + compresor',102,0,true,now()),('Extra','Power bank USB',102,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>destornillador eléctrico</strong> aprieta y afloja tornillos en segundos, sin esfuerzo. Recargable, compacto y con puntas intercambiables para armar muebles, reparar y montar cosas en casa. Práctico para todo tipo de trabajo.</p>' WHERE id=383;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=383;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Atornilla y desatornilla sin esfuerzo',383,0,true,now()),('Puntas intercambiables',383,1,true,now()),('Recargable y compacto',383,2,true,now()),('Ideal para armar muebles y reparar',383,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=383;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Destornillador eléctrico',383,0,true,now()),('Alimentación','Recargable',383,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>mini sierra</strong> corta madera, tubos y ramas con facilidad gracias a su tamaño compacto y buen agarre. Inalámbrica y recargable, ideal para trabajos rápidos y precisos en casa o el taller.</p>' WHERE id=98;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=98;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Corta madera, tubos y ramas',98,0,true,now()),('Compacta y de buen agarre',98,1,true,now()),('Inalámbrica y recargable',98,2,true,now()),('Ideal para trabajos rápidos',98,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=98;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini sierra',98,0,true,now()),('Alimentación','Recargable',98,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>mini sierra inalámbrica 48V</strong> viene con doble batería, 2 hojas y 4 cadenas para cortar madera y ramas sin parar. Potente, liviana y de fácil manejo, ideal para podar y trabajos de jardín o taller.</p>' WHERE id=146;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=146;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Incluye doble batería para más autonomía',146,0,true,now()),('2 hojas y 4 cadenas de repuesto',146,1,true,now()),('Potente (48V) y liviana',146,2,true,now()),('Ideal para podar y cortar ramas',146,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=146;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini motosierra inalámbrica',146,0,true,now()),('Batería','48V (doble incluida)',146,1,true,now()),('Incluye','2 hojas + 4 cadenas',146,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pulidora eléctrica</strong> saca brillo a la carrocería del carro, pule superficies y remueve imperfecciones con sus discos. Fácil de manejar y de buena potencia, ideal para dejar todo reluciente.</p>' WHERE id=99;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=99;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Saca brillo y pule superficies',99,0,true,now()),('Ideal para carrocería y acabados',99,1,true,now()),('Buena potencia y fácil manejo',99,2,true,now()),('Con discos para pulir',99,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=99;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pulidora eléctrica',99,0,true,now()),('Uso','Carro / acabados',99,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pulidora eléctrica de 7 pulgadas</strong> tiene el tamaño ideal para pulir y sacar brillo a la carrocería, muebles y superficies grandes. Potente y con velocidad regulable para un acabado profesional.</p>' WHERE id=368;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=368;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Disco de 7 pulgadas para superficies grandes',368,0,true,now()),('Saca brillo y pule con potencia',368,1,true,now()),('Velocidad regulable',368,2,true,now()),('Acabado profesional',368,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=368;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pulidora eléctrica',368,0,true,now()),('Disco','7 pulgadas',368,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pistola para pintar (paint sprayer)</strong> aplica pintura de forma pareja y rápida en paredes, muebles y rejas, sin marcas de brocha. Regula el flujo y el patrón para un acabado profesional. Fácil de usar y limpiar.</p>' WHERE id=394;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=394;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Aplica pintura pareja, sin marcas de brocha',394,0,true,now()),('Flujo y patrón regulables',394,1,true,now()),('Ideal para paredes, muebles y rejas',394,2,true,now()),('Fácil de usar y limpiar',394,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=394;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pistola para pintar',394,0,true,now()),('Uso','Pintura / acabados',394,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pulverizadora</strong> es ideal para fumigar, regar y aplicar líquidos en el jardín o el cultivo. Rocía de forma pareja y ajustable, cubriendo más en menos tiempo. Cómoda de cargar y de buena capacidad.</p>' WHERE id=370;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=370;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Fumiga, riega y aplica líquidos',370,0,true,now()),('Rociado parejo y ajustable',370,1,true,now()),('Buena capacidad para cubrir más',370,2,true,now()),('Cómoda de cargar',370,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=370;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pulverizadora / fumigadora',370,0,true,now()),('Uso','Jardín / cultivo',370,1,true,now());
