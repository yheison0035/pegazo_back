-- ============================================================================
-- Contenido · HERRAMIENTAS (tanda 2 de 2). Descripción + características + specs.
-- Idempotente. No se cambian nombres.
-- ============================================================================

UPDATE "Inventory" SET description='<p>El <strong>taladro percutor inalámbrico 18V</strong> perfora madera, metal y pared, y atornilla con fuerza. Batería recargable, velocidad regulable y giro reversible para todo tipo de trabajo en casa. Cómodo y liviano.</p>' WHERE id=112;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=112;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Perfora madera, metal y pared',112,0,true,now()),('Atornilla con fuerza y giro reversible',112,1,true,now()),('Inalámbrico y recargable (18V)',112,2,true,now()),('Velocidad regulable',112,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=112;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro percutor inalámbrico',112,0,true,now()),('Batería','18V recargable',112,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro 24V con kit de 30 piezas</strong> viene completo con brocas y puntas para perforar y atornillar desde el primer día. Inalámbrico y recargable, con buena potencia para tus proyectos en casa.</p>' WHERE id=371;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=371;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Incluye kit de 30 brocas y puntas',371,0,true,now()),('Perfora y atornilla',371,1,true,now()),('Inalámbrico y recargable (24V)',371,2,true,now()),('Listo para usar desde el primer día',371,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=371;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro inalámbrico',371,0,true,now()),('Batería','24V recargable',371,1,true,now()),('Incluye','Kit de 30 piezas',371,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro 68V con kit de 30 piezas</strong> ofrece gran potencia para perforar y atornillar en trabajos más exigentes. Inalámbrico y recargable, incluye brocas y puntas para empezar a usarlo de inmediato.</p>' WHERE id=372;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=372;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran potencia (68V)',372,0,true,now()),('Incluye kit de 30 brocas y puntas',372,1,true,now()),('Perfora madera, metal y pared',372,2,true,now()),('Inalámbrico y recargable',372,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=372;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro inalámbrico',372,0,true,now()),('Batería','68V recargable',372,1,true,now()),('Incluye','Kit de 30 piezas',372,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro percutor 68V</strong> combina potencia y buena batería para perforar y atornillar con facilidad, incluso en materiales duros. Inalámbrico, con velocidad regulable y giro reversible para todo tipo de trabajo.</p>' WHERE id=374;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=374;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Alta potencia (68V)',374,0,true,now()),('Perfora materiales duros',374,1,true,now()),('Velocidad regulable y giro reversible',374,2,true,now()),('Inalámbrico y recargable',374,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=374;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro percutor inalámbrico',374,0,true,now()),('Batería','68V recargable',374,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro brilladora</strong> es 2 en 1: perfora y atornilla, y con el accesorio adecuado también pule y saca brillo. Práctico y versátil para el hogar, te ahorra tener dos herramientas. Inalámbrico y recargable.</p>' WHERE id=96;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=96;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: taladra y pule',96,0,true,now()),('Perfora, atornilla y saca brillo',96,1,true,now()),('Versátil y práctico para el hogar',96,2,true,now()),('Inalámbrico y recargable',96,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=96;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro / brilladora',96,0,true,now()),('Alimentación','Recargable',96,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro eléctrico</strong> perfora madera, metal y pared con la potencia constante de la conexión a corriente. Velocidad regulable y giro reversible para atornillar y desatornillar. Robusto y confiable para tus proyectos.</p>' WHERE id=147;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=147;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Potencia constante (con cable)',147,0,true,now()),('Perfora madera, metal y pared',147,1,true,now()),('Velocidad regulable y giro reversible',147,2,true,now()),('Robusto y confiable',147,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=147;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Taladro eléctrico (con cable)',147,0,true,now()),('Uso','Perforar / atornillar',147,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>mini taladro atornillador</strong> es compacto y liviano, ideal para trabajos pequeños, armar muebles y atornillar en espacios reducidos. Recargable y fácil de manejar, cabe en cualquier caja de herramientas.</p>' WHERE id=369;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=369;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Compacto para espacios reducidos',369,0,true,now()),('Ideal para armar muebles y atornillar',369,1,true,now()),('Recargable y liviano',369,2,true,now()),('Fácil de manejar',369,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=369;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mini taladro atornillador',369,0,true,now()),('Alimentación','Recargable',369,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>taladro Prower</strong> perfora y atornilla con buena potencia para tus proyectos en casa. Velocidad regulable y giro reversible, cómodo de usar y resistente. Un aliado confiable para el día a día.</p>' WHERE id=97;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=97;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Perfora y atornilla con potencia',97,0,true,now()),('Velocidad regulable y giro reversible',97,1,true,now()),('Cómodo de usar',97,2,true,now()),('Resistente y confiable',97,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=97;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Prower',97,0,true,now()),('Tipo','Taladro',97,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pistola de impacto DeWalt</strong> afloja y aprieta tuercas y tornillos con gran torque, ideal para cambiar llantas y trabajos de mecánica. Inalámbrica y recargable, potente y de fácil manejo.</p>' WHERE id=95;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=95;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran torque para tuercas y tornillos',95,0,true,now()),('Ideal para cambiar llantas y mecánica',95,1,true,now()),('Inalámbrica y recargable',95,2,true,now()),('Potente y fácil de manejar',95,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=95;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','DeWalt',95,0,true,now()),('Tipo','Pistola / llave de impacto',95,1,true,now()),('Alimentación','Recargable',95,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pistola de impacto Makita</strong> entrega gran torque para aflojar y apretar tuercas con facilidad, perfecta para mecánica y cambio de llantas. Inalámbrica y recargable, resistente y de buen agarre.</p>' WHERE id=94;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=94;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Gran torque para tuercas y tornillos',94,0,true,now()),('Ideal para mecánica y cambio de llantas',94,1,true,now()),('Inalámbrica y recargable',94,2,true,now()),('Resistente y de buen agarre',94,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=94;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Makita',94,0,true,now()),('Tipo','Pistola / llave de impacto',94,1,true,now()),('Alimentación','Recargable',94,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de llaves y copas de 82 piezas</strong> reúne todo para tus reparaciones de casa, moto y carro. Copas de varias medidas, llaves, ratchet y accesorios, organizados en su maletín. En acero resistente.</p>' WHERE id=101;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=101;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('82 piezas: copas, llaves y accesorios',101,0,true,now()),('Para casa, moto y carro',101,1,true,now()),('Organizado en maletín',101,2,true,now()),('Acero resistente',101,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=101;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Juego de llaves y copas',101,0,true,now()),('Piezas','82',101,1,true,now()),('Material','Acero',101,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de copas de 46 piezas</strong> trae copas de distintas medidas, ratchet y puntas para atornillar y aflojar tuercas. Todo organizado en su estuche, en acero resistente. Ideal para casa y carro.</p>' WHERE id=113;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=113;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('46 piezas: copas, ratchet y puntas',113,0,true,now()),('Varias medidas para cada tuerca',113,1,true,now()),('Organizado en estuche',113,2,true,now()),('Acero resistente',113,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=113;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Juego de copas',113,0,true,now()),('Piezas','46',113,1,true,now()),('Material','Acero',113,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de llaves de 12 piezas</strong> incluye las medidas más usadas para apretar y aflojar tuercas en casa, moto o carro. Llaves resistentes en acero, cómodas de usar y fáciles de guardar.</p>' WHERE id=367;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=367;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('12 llaves con las medidas más usadas',367,0,true,now()),('Para casa, moto y carro',367,1,true,now()),('Acero resistente',367,2,true,now()),('Cómodas y fáciles de guardar',367,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=367;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Juego de llaves',367,0,true,now()),('Piezas','12',367,1,true,now()),('Material','Acero',367,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de llaves ratchet de 7 piezas</strong> agiliza tu trabajo: con su sistema de trinquete aprietas y aflojas sin sacar la llave cada vez. Medidas surtidas en acero resistente, ideales para mecánica y reparaciones.</p>' WHERE id=373;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=373;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sistema ratchet: más rápido y cómodo',373,0,true,now()),('7 llaves de medidas surtidas',373,1,true,now()),('Acero resistente',373,2,true,now()),('Ideales para mecánica y reparaciones',373,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=373;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Llaves ratchet (trinquete)',373,0,true,now()),('Piezas','7',373,1,true,now()),('Material','Acero',373,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>carreta plegable</strong> te ayuda a transportar mercado, cajas o herramientas sin cargar peso. Soporta bastante y se pliega para guardarla en poco espacio. Resistente, con ruedas firmes para cualquier terreno.</p>' WHERE id=366;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=366;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Transporta mercado, cajas y herramientas',366,0,true,now()),('Plegable: ocupa poco espacio',366,1,true,now()),('Soporta buena carga',366,2,true,now()),('Ruedas firmes para cualquier terreno',366,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=366;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Carreta plegable de carga',366,0,true,now()),('Uso','Transporte',366,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>escalera de acero de 3 peldaños</strong> te da altura segura para alcanzar estantes, cambiar bombillas o limpiar. Resistente, estable y plegable para guardarla fácil en casa. Peldaños antideslizantes.</p>' WHERE id=393;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=393;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('3 peldaños antideslizantes',393,0,true,now()),('Estructura de acero resistente',393,1,true,now()),('Estable y segura',393,2,true,now()),('Plegable para guardar fácil',393,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=393;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Escalera plegable',393,0,true,now()),('Material','Acero',393,1,true,now()),('Peldaños','3',393,2,true,now());

UPDATE "Inventory" SET description='<p>Los <strong>radios Baofeng</strong> te mantienen comunicado sin gastar datos ni saldo: ideales para trabajo, seguridad, viajes o paseos en zonas sin señal. Largo alcance, resistentes y recargables. Se venden por par.</p>' WHERE id=103;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=103;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Comunicación sin datos ni saldo',103,0,true,now()),('Largo alcance',103,1,true,now()),('Ideales para trabajo, viajes y seguridad',103,2,true,now()),('Resistentes y recargables',103,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=103;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Baofeng',103,0,true,now()),('Tipo','Radios de comunicación',103,1,true,now()),('Alimentación','Recargable',103,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>ventilador recargable 56V</strong> te refresca donde estés, sin depender de un tomacorriente. Inalámbrico y de buena autonomía, ideal para el cuarto, la oficina, el taller o cortes de luz. Varias velocidades.</p>' WHERE id=107;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=107;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Inalámbrico y recargable (56V)',107,0,true,now()),('Refresca sin depender de un tomacorriente',107,1,true,now()),('Varias velocidades',107,2,true,now()),('Ideal para cortes de luz',107,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=107;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Ventilador recargable',107,0,true,now()),('Batería','56V recargable',107,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>tapete sanitario para mascotas</strong> facilita el entrenamiento de tu perro para que haga sus necesidades en un solo lugar. Fácil de lavar y reutilizable, mantiene el piso limpio y ordenado.</p>' WHERE id=170;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=170;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Ayuda a entrenar a tu mascota',170,0,true,now()),('Mantiene el piso limpio',170,1,true,now()),('Lavable y reutilizable',170,2,true,now()),('Fácil de usar',170,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=170;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Tapete sanitario para mascotas',170,0,true,now()),('Uso','Entrenamiento',170,1,true,now());

UPDATE "Inventory" SET description='<p>Las <strong>tijeras Lemman</strong> son resistentes y filosas para cortar con precisión en el jardín, la casa o el taller. Mango cómodo y ergonómico para un corte fácil y sin cansar la mano. Duraderas y multiusos.</p>' WHERE id=100;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=100;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Filosas y resistentes',100,0,true,now()),('Mango cómodo y ergonómico',100,1,true,now()),('Multiusos: jardín, casa y taller',100,2,true,now()),('Duraderas',100,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=100;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Lemman',100,0,true,now()),('Tipo','Tijeras multiusos',100,1,true,now());
