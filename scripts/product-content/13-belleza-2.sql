-- ============================================================================
-- Contenido · BELLEZA MUJER (tanda 2: masajeadores, cuidado personal, salud,
-- cosmetiqueras y varios). Descripción + características + specs. Idempotente.
-- ============================================================================

UPDATE "Inventory" SET description='<p>El <strong>masajeador de 8 puntas</strong> relaja cuello, espalda y piernas con sus cabezales giratorios que imitan un masaje real. Alivia tensiones y activa la circulación en casa. Fácil de sostener y de usar.</p>' WHERE id=378;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=378;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('8 puntas giratorias para un masaje profundo',378,0,true,now()),('Relaja cuello, espalda y piernas',378,1,true,now()),('Activa la circulación',378,2,true,now()),('Fácil de sostener y usar',378,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=378;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador 8 puntas',378,0,true,now()),('Uso','Cuerpo',378,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>masajeador electro multifuncional</strong> usa electroestimulación (EMS) para relajar y tonificar distintas zonas del cuerpo con parches adhesivos. Varios modos e intensidades, recargable y fácil de usar en casa.</p>' WHERE id=381;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=381;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Electroestimulación (EMS) con parches',381,0,true,now()),('Relaja y tonifica varias zonas',381,1,true,now()),('Varios modos e intensidades',381,2,true,now()),('Recargable por USB',381,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=381;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Electroestimulador (EMS)',381,0,true,now()),('Alimentación','Recargable',381,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>masajeador facial con luz LED</strong> combina masaje suave con luz de colores para cuidar tu piel: ayuda a relajar, mejorar la apariencia y potenciar la absorción de tus cremas. Recargable y fácil de usar.</p>' WHERE id=65;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=65;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje facial con luz LED',65,0,true,now()),('Ayuda a que la piel luzca mejor',65,1,true,now()),('Potencia la absorción de cremas',65,2,true,now()),('Recargable y fácil de usar',65,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=65;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador facial LED',65,0,true,now()),('Uso','Cuidado de la piel',65,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>masajeador facial pequeño</strong> es perfecto para llevar en el bolso: relaja el rostro, ayuda a desinflamar y activa la circulación con su vibración suave. Compacto, recargable y fácil de usar.</p>' WHERE id=66;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=66;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Compacto: cabe en el bolso',66,0,true,now()),('Relaja y desinflama el rostro',66,1,true,now()),('Vibración suave que activa la circulación',66,2,true,now()),('Recargable y fácil de usar',66,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=66;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador facial',66,0,true,now()),('Tamaño','Pequeño / portátil',66,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>pistola masajeadora frío-calor</strong> descarga los músculos con masaje de percusión y terapia de frío y calor. Alivia dolores y tensiones, ideal después del ejercicio. Recargable y con varios cabezales.</p>' WHERE id=379;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=379;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje de percusión con frío y calor',379,0,true,now()),('Alivia dolores y tensiones',379,1,true,now()),('Ideal después del ejercicio',379,2,true,now()),('Recargable y con varios cabezales',379,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=379;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pistola de masaje',379,0,true,now()),('Funciones','Percusión + frío/calor',379,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>removedor de callos eléctrico profesional</strong> elimina durezas y callos de los pies dejándolos suaves en minutos. Con rodillo giratorio y varias intensidades, recargable e higiénico. Pedicure de salón en casa.</p>' WHERE id=61;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=61;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Elimina durezas y callos en minutos',61,0,true,now()),('Rodillo giratorio y varias intensidades',61,1,true,now()),('Deja los pies suaves',61,2,true,now()),('Recargable e higiénico',61,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=61;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Removedor de callos eléctrico',61,0,true,now()),('Alimentación','Recargable',61,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>removedor de callos sencillo</strong> elimina durezas y callos de los pies de forma rápida y práctica, dejándolos suaves. Fácil de usar en casa para un pedicure sin complicaciones.</p>' WHERE id=62;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=62;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Elimina durezas y callos',62,0,true,now()),('Deja los pies suaves',62,1,true,now()),('Práctico y fácil de usar',62,2,true,now()),('Ideal para pedicure en casa',62,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=62;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Removedor de callos',62,0,true,now()),('Uso','Pies',62,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>limpiador facial 5 en 1</strong> limpia, exfolia y masajea tu piel con sus cabezales intercambiables. Ayuda a remover impurezas y células muertas para un rostro más limpio y suave. Recargable y resistente al agua.</p>' WHERE id=60;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=60;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('5 cabezales: limpia, exfolia y masajea',60,0,true,now()),('Remueve impurezas y células muertas',60,1,true,now()),('Rostro más limpio y suave',60,2,true,now()),('Recargable y resistente al agua',60,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=60;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Limpiador facial 5 en 1',60,0,true,now()),('Alimentación','Recargable',60,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>monopatín 5 en 1</strong> acompaña el crecimiento de los niños: se transforma para distintas edades y etapas, de paseo a scooter. Estructura resistente, ruedas suaves y diseño seguro y divertido.</p>' WHERE id=382;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=382;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('5 en 1: se transforma según la edad',382,0,true,now()),('Estructura resistente y segura',382,1,true,now()),('Ruedas suaves',382,2,true,now()),('Divertido para los niños',382,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=382;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Monopatín / scooter 5 en 1',382,0,true,now()),('Uso','Niños',382,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>monitor de presión arterial automático</strong> mide tu presión y pulso de forma fácil y precisa en casa. Colócalo en el brazo, presiona y listo. Pantalla grande, memoria de mediciones e ideal para toda la familia.</p>' WHERE id=256;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=256;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Medición automática de presión y pulso',256,0,true,now()),('Pantalla grande fácil de leer',256,1,true,now()),('Guarda mediciones en memoria',256,2,true,now()),('Ideal para toda la familia',256,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=256;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Mide','Presión arterial + pulso',256,0,true,now()),('Colocación','Brazo',256,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>tensiómetro de muñeca digital</strong> mide tu presión y pulso donde estés: compacto, se coloca en la muñeca y da el resultado en segundos. Pantalla clara y memoria de mediciones para llevar el control de tu salud.</p>' WHERE id=257;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=257;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Se coloca en la muñeca',257,0,true,now()),('Mide presión y pulso en segundos',257,1,true,now()),('Compacto y portátil',257,2,true,now()),('Pantalla clara con memoria',257,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=257;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Mide','Presión arterial + pulso',257,0,true,now()),('Colocación','Muñeca',257,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>cosmetiquera grande</strong> guarda todo tu maquillaje, brochas y accesorios con espacio de sobra. Con divisiones para tenerlo todo ordenado, resistente y práctica para casa o viaje.</p>' WHERE id=354;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=354;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Amplia: cabe todo tu maquillaje',354,0,true,now()),('Divisiones para mantener el orden',354,1,true,now()),('Resistente y fácil de limpiar',354,2,true,now()),('Ideal para casa o viaje',354,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=354;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cosmetiquera',354,0,true,now()),('Tamaño','Grande',354,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>cosmetiquera mediana</strong> es el tamaño perfecto para llevar lo esencial de tu maquillaje. Práctica y con buen espacio, mantiene todo ordenado y a la mano en casa o de viaje.</p>' WHERE id=355;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=355;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tamaño ideal para lo esencial',355,0,true,now()),('Buen espacio y orden',355,1,true,now()),('Resistente y fácil de limpiar',355,2,true,now()),('Práctica para llevar',355,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=355;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cosmetiquera',355,0,true,now()),('Tamaño','Mediana',355,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>cosmetiquera pequeña</strong> es compacta para llevar tus básicos de maquillaje en el bolso. Ligera, resistente y práctica para tenerlo todo ordenado donde vayas.</p>' WHERE id=356;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=356;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Compacta: cabe en el bolso',356,0,true,now()),('Ligera y resistente',356,1,true,now()),('Para tus básicos de maquillaje',356,2,true,now()),('Práctica y ordenada',356,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=356;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cosmetiquera',356,0,true,now()),('Tamaño','Pequeña',356,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>hidrolavadora portátil</strong> lava tu carro, moto, patio o fachada con agua a presión. Inalámbrica y recargable, succiona el agua desde un balde para usarla donde quieras, sin toma de agua fija.</p>' WHERE id=376;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=376;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agua a presión sin toma fija (usa un balde)',376,0,true,now()),('Inalámbrica y recargable',376,1,true,now()),('Lava carro, moto, patio y fachada',376,2,true,now()),('Portátil y fácil de usar',376,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=376;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Hidrolavadora portátil',376,0,true,now()),('Alimentación','Recargable',376,1,true,now());

UPDATE "Inventory" SET description='<p>Los <strong>radios Baofeng BF-888S</strong> te mantienen comunicado sin gastar datos ni saldo, ideales para trabajo, seguridad o paseos en zonas sin señal. Largo alcance, resistentes y recargables. Se venden por par.</p>' WHERE id=253;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=253;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Comunicación sin datos ni saldo',253,0,true,now()),('Largo alcance',253,1,true,now()),('Ideales para trabajo, viajes y seguridad',253,2,true,now()),('Resistentes y recargables',253,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=253;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca / modelo','Baofeng BF-888S',253,0,true,now()),('Tipo','Radios de comunicación',253,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>kit completo estudiantil</strong> reúne los útiles esenciales para el colegio en un solo set: ideal para regalar o empezar el año escolar. Práctico, completo y organizado.</p>' WHERE id=302;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=302;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Set completo de útiles escolares',302,0,true,now()),('Ideal para regalar o el regreso a clases',302,1,true,now()),('Práctico y organizado',302,2,true,now()),('Todo lo esencial en un solo kit',302,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=302;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Kit escolar / estudiantil',302,0,true,now()),('Uso','Colegio',302,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de llaves de 12 piezas (doble)</strong> trae llaves de doble boca con las medidas más usadas para reparaciones en casa, moto o carro. En acero resistente, cómodas de usar y fáciles de guardar.</p>' WHERE id=377;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=377;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('12 llaves de doble boca',377,0,true,now()),('Medidas más usadas para reparar',377,1,true,now()),('Acero resistente',377,2,true,now()),('Para casa, moto y carro',377,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=377;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Juego de llaves',377,0,true,now()),('Piezas','12 (doble boca)',377,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>lámpara LED 2 en 1</strong> sirve como luz de escritorio y ambiente en un solo aparato. Con brillo ajustable e ideal para estudiar, leer o decorar. Recargable y práctica para cualquier espacio.</p>' WHERE id=58;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=58;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: luz de escritorio y ambiente',58,0,true,now()),('Brillo ajustable',58,1,true,now()),('Ideal para estudiar, leer o decorar',58,2,true,now()),('Recargable y práctica',58,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=58;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Lámpara LED 2 en 1',58,0,true,now()),('Alimentación','Recargable',58,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>lámpara Sun AB-98</strong> proyecta una luz cálida tipo atardecer que crea un ambiente relajante y decorativo, perfecta para fotos, videos o ambientar tu cuarto. Con distintos tonos y ángulos ajustables.</p>' WHERE id=59;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=59;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Luz cálida tipo atardecer (sunset)',59,0,true,now()),('Ambiente relajante y decorativo',59,1,true,now()),('Ideal para fotos y videos',59,2,true,now()),('Tonos y ángulos ajustables',59,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=59;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','Sun AB-98',59,0,true,now()),('Tipo','Lámpara ambiente (sunset)',59,1,true,now());
