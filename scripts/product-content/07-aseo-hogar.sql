-- ============================================================================
-- Contenido · ASEO (15) + HOGAR (7). Descripción + características + specs.
-- Idempotente. Solo se corrige el nombre id 57 (typo).
-- ============================================================================

-- ═══════════════ ASEO ═══════════════

UPDATE "Inventory" SET description='<p>Deja tus pisos impecables sin esfuerzo con la <strong>aspiradora inteligente</strong>. Barre y aspira sola el polvo, las migas y el pelo de mascotas, esquivando obstáculos. Recargable y silenciosa, ideal para mantener la casa limpia todos los días.</p>' WHERE id=358;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=358;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Aspira sola polvo, migas y pelo de mascotas',358,0,true,now()),('Esquiva obstáculos automáticamente',358,1,true,now()),('Recargable y silenciosa',358,2,true,now()),('Ideal para limpieza diaria',358,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=358;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Aspiradora robot',358,0,true,now()),('Alimentación','Recargable',358,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>cepillo de limpieza 9 en 1</strong> llega a cada rincón con sus accesorios intercambiables: cocina, baño, ventanas, ranuras y más. Cerdas resistentes que quitan la mugre difícil con menos esfuerzo.</p>' WHERE id=32;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=32;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('9 accesorios para distintas superficies',32,0,true,now()),('Llega a rincones y ranuras difíciles',32,1,true,now()),('Cerdas resistentes que quitan la mugre',32,2,true,now()),('Práctico para cocina y baño',32,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=32;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo de limpieza multiusos',32,0,true,now()),('Accesorios','9 en 1',32,1,true,now());

UPDATE "Inventory" SET description='<p>Adiós al pelo por toda la casa con el <strong>cepillo para mascotas</strong>. Retira el pelo suelto de perros y gatos y recoge el que queda en muebles y ropa. Cómodo, fácil de limpiar y suave con tu mascota.</p>' WHERE id=24;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=24;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Retira el pelo suelto de perros y gatos',24,0,true,now()),('También recoge pelo de muebles y ropa',24,1,true,now()),('Suave con la piel de la mascota',24,2,true,now()),('Fácil de limpiar',24,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=24;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo quita pelos',24,0,true,now()),('Uso','Mascotas',24,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>dispensador de jabón automático</strong> saca la cantidad justa con solo acercar la mano, sin tocar nada. Más higiene y menos desperdicio en la cocina o el baño. Recargable y con sensor rápido.</p>' WHERE id=29;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=29;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Sensor automático: no lo tocas',29,0,true,now()),('Dosifica la cantidad justa de jabón',29,1,true,now()),('Más higiene y menos desperdicio',29,2,true,now()),('Recargable por USB',29,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=29;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Dispensador automático',29,0,true,now()),('Alimentación','Recargable',29,1,true,now());

UPDATE "Inventory" SET description='<p>Mantén a tu gato hidratado con la <strong>fuente de agua para gatos</strong>. El agua circula fresca y filtrada para animar a tu mascota a beber más. Silenciosa y fácil de limpiar, ideal para su salud.</p>' WHERE id=83;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=83;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agua circulante fresca y filtrada',83,0,true,now()),('Anima a tu gato a beber más',83,1,true,now()),('Funcionamiento silencioso',83,2,true,now()),('Fácil de limpiar',83,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=83;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Fuente de agua para gatos',83,0,true,now()),('Alimentación','USB',83,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>fuente de agua para gatos WF-060</strong> ofrece agua fresca y en movimiento para que tu mascota se hidrate mejor. Con filtro que mantiene el agua limpia, funcionamiento silencioso y fácil de lavar.</p>' WHERE id=70;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=70;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agua fresca y en movimiento',70,0,true,now()),('Filtro que mantiene el agua limpia',70,1,true,now()),('Silenciosa',70,2,true,now()),('Fácil de lavar',70,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=70;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','WF-060',70,0,true,now()),('Tipo','Fuente de agua para gatos',70,1,true,now()),('Alimentación','USB',70,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>fuente de agua para gatos XR-10</strong> mantiene el agua fresca y filtrada para animar a tu gato a hidratarse. Silenciosa, con buena capacidad y fácil de limpiar. Cuida la salud de tu mascota.</p>' WHERE id=84;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=84;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Agua fresca y filtrada todo el día',84,0,true,now()),('Anima a tu gato a beber más',84,1,true,now()),('Silenciosa y de buena capacidad',84,2,true,now()),('Fácil de limpiar',84,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=84;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','XR-10',84,0,true,now()),('Tipo','Fuente de agua para gatos',84,1,true,now()),('Alimentación','USB',84,2,true,now());

UPDATE "Inventory" SET name='HUMIDIFICADOR POR GRAVEDAD', description='<p>El <strong>humidificador por gravedad</strong> usa una botella de agua para humidificar el ambiente sin rellenar a cada rato. Genera vapor frío que hidrata el aire, ideal para dormir mejor y aliviar la resequedad. Silencioso y práctico.</p>' WHERE id=57;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=57;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Funciona con una botella de agua',57,0,true,now()),('Vapor frío que hidrata el ambiente',57,1,true,now()),('Ideal para dormir mejor',57,2,true,now()),('Silencioso y práctico',57,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=57;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Humidificador por gravedad',57,0,true,now()),('Alimentación','USB',57,1,true,now());

UPDATE "Inventory" SET description='<p>Cuida tu salud bucal con el <strong>irrigador bucal</strong>. Su chorro de agua a presión elimina restos de comida y placa entre los dientes y la línea de las encías, donde el cepillo no llega. Recargable y con varias intensidades.</p>' WHERE id=33;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=33;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Chorro a presión que limpia entre los dientes',33,0,true,now()),('Llega donde el cepillo no alcanza',33,1,true,now()),('Varias intensidades',33,2,true,now()),('Recargable por USB',33,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=33;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Irrigador bucal',33,0,true,now()),('Alimentación','Recargable',33,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>jabonera con esponja</strong> mantiene tu jabón líquido y la esponja en un solo lugar, con dispensador para lavar la loza más fácil. Práctica y ordenada para tu lavaplatos.</p>' WHERE id=365;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=365;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Dispensa jabón y guarda la esponja',365,0,true,now()),('Todo en un solo lugar, ordenado',365,1,true,now()),('Facilita lavar la loza',365,2,true,now()),('Práctica y fácil de limpiar',365,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=365;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Jabonera con dispensador',365,0,true,now()),('Uso','Lavaplatos',365,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>máquina de vapor para muebles</strong> higieniza y refresca tapicería, colchones, cortinas y sofás con vapor caliente, sin químicos. Elimina ácaros y olores dejando todo limpio y desinfectado.</p>' WHERE id=1;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=1;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Limpia con vapor caliente, sin químicos',1,0,true,now()),('Ideal para tapicería, colchones y cortinas',1,1,true,now()),('Elimina ácaros y olores',1,2,true,now()),('Desinfecta y refresca',1,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=1;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Limpiadora a vapor',1,0,true,now()),('Uso','Muebles y tapicería',1,1,true,now());

UPDATE "Inventory" SET description='<p><strong>Mopas de repuesto para trapero giratorio</strong> en microfibra, que atrapan el polvo y absorben bien el agua para dejar tus pisos relucientes. Lavables y reutilizables para alargar la vida de tu trapero.</p>' WHERE id=120;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=120;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Microfibra que atrapa el polvo',120,0,true,now()),('Absorbe bien el agua',120,1,true,now()),('Lavables y reutilizables',120,2,true,now()),('Repuesto para trapero giratorio',120,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=120;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Mopas de repuesto',120,0,true,now()),('Material','Microfibra',120,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>organizador de ropa sucia</strong> mantiene el cuarto o el baño en orden. Cesto amplio y plegable que guarda la ropa lista para lavar y se dobla para ocupar poco espacio cuando no lo usas.</p>' WHERE id=363;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=363;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cesto amplio para ropa sucia',363,0,true,now()),('Plegable: ocupa poco espacio',363,1,true,now()),('Mantiene el cuarto ordenado',363,2,true,now()),('Resistente y liviano',363,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=363;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Organizador / cesto',363,0,true,now()),('Uso','Ropa sucia',363,1,true,now());

UPDATE "Inventory" SET description='<p>Deja tu ropa lista sin tabla con la <strong>plancha a vapor vertical</strong>. Estira arrugas colgando la prenda, ideal para camisas, vestidos y cortinas. Calienta rápido y es práctica para casa o para viajar.</p>' WHERE id=165;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=165;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Plancha la ropa colgada, sin tabla',165,0,true,now()),('Ideal para camisas, vestidos y cortinas',165,1,true,now()),('Calienta rápido',165,2,true,now()),('Práctica para casa o viaje',165,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=165;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Plancha vertical a vapor',165,0,true,now()),('Uso','Ropa colgada',165,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>trapero giratorio 360</strong> limpia y exprime sin agacharte ni mojarte las manos. Su sistema de centrifugado escurre la mopa con un giro, para trapear más rápido y dejar los pisos casi secos. Incluye balde y mopas.</p>' WHERE id=114;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=114;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Centrifugado que exprime con un giro',114,0,true,now()),('Trapea sin agacharte ni mojarte las manos',114,1,true,now()),('Deja los pisos casi secos',114,2,true,now()),('Incluye balde y mopas',114,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=114;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Trapero giratorio 360°',114,0,true,now()),('Incluye','Balde + mopas',114,1,true,now());

-- ═══════════════ HOGAR ═══════════════

UPDATE "Inventory" SET description='<p>Vigila tu casa con la <strong>cámara de seguridad tipo bombillo</strong>. Se enrosca como una bombilla y te deja ver en vivo desde el celular, con visión nocturna y detección de movimiento. Vista panorámica y grabación en microSD.</p>' WHERE id=406;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=406;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Se instala como una bombilla',406,0,true,now()),('Ves en vivo desde el celular',406,1,true,now()),('Visión nocturna y detección de movimiento',406,2,true,now()),('Vista panorámica 360°',406,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=406;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cámara WiFi tipo bombillo',406,0,true,now()),('Conexión','WiFi 2.4 GHz',406,1,true,now()),('Grabación','MicroSD',406,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>juego de mesa Basta</strong> reúne a la familia y los amigos: al caer la letra, todos escriben nombre, animal, cosa, país y más para sumar puntos. Diversión clásica para todas las edades.</p>' WHERE id=426;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=426;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diversión para toda la familia',426,0,true,now()),('Categorías: nombre, animal, cosa, país y más',426,1,true,now()),('Para varios jugadores',426,2,true,now()),('Ideal para reuniones',426,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=426;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Juego de mesa',426,0,true,now()),('Jugadores','2 o más',426,1,true,now());

UPDATE "Inventory" SET description='<p>Carga y conecta varios equipos a la vez con la <strong>multitoma con puertos USB</strong>. Combina tomas de corriente y salidas USB para el celular, el computador y más, todo en un solo lugar y de forma segura.</p>' WHERE id=416;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=416;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Tomas de corriente + puertos USB',416,0,true,now()),('Carga varios equipos a la vez',416,1,true,now()),('Práctica para casa u oficina',416,2,true,now()),('Diseño compacto y seguro',416,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=416;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Multitoma con USB',416,0,true,now()),('Uso','Casa / oficina',416,1,true,now());

UPDATE "Inventory" SET description='<p>Instala tu televisor en la pared con el <strong>soporte para TV de hasta 55 pulgadas</strong>. Firme y resistente, ahorra espacio y da un acabado ordenado a tu sala. Incluye tornillería para una instalación segura.</p>' WHERE id=423;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=423;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Soporta televisores de hasta 55 pulgadas',423,0,true,now()),('Firme y resistente',423,1,true,now()),('Ahorra espacio y ordena la sala',423,2,true,now()),('Incluye tornillería',423,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=423;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Soporte de pared para TV',423,0,true,now()),('Tamaño máx.','55 pulgadas',423,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>termo grande</strong> conserva tus bebidas frías o calientes por horas. Amplia capacidad para llevar agua, café o jugo al trabajo, al gimnasio o de paseo. Resistente, con cierre seguro y fácil de limpiar.</p>' WHERE id=412;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=412;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Conserva frío o caliente por horas',412,0,true,now()),('Gran capacidad para todo el día',412,1,true,now()),('Cierre seguro antiderrames',412,2,true,now()),('Resistente y fácil de limpiar',412,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=412;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Termo',412,0,true,now()),('Tamaño','Grande',412,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>termo Hello</strong> es ideal para los niños: conserva la bebida a buena temperatura y es fácil de abrir y llevar al colegio. Diseño divertido, cierre seguro y materiales resistentes.</p>' WHERE id=413;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=413;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Conserva la bebida a buena temperatura',413,0,true,now()),('Diseño divertido para niños',413,1,true,now()),('Fácil de abrir y llevar',413,2,true,now()),('Cierre seguro antiderrames',413,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=413;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Termo infantil',413,0,true,now()),('Uso','Colegio / paseo',413,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>termo Sitarayuli</strong> mantiene tus bebidas frías o calientes por horas con su diseño de doble pared. Cómodo de llevar, con cierre seguro y acabado moderno para el día a día.</p>' WHERE id=414;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=414;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Doble pared: conserva frío o caliente',414,0,true,now()),('Cómodo de llevar a todas partes',414,1,true,now()),('Cierre seguro antiderrames',414,2,true,now()),('Diseño moderno',414,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=414;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Sitarayuli',414,0,true,now()),('Tipo','Termo doble pared',414,1,true,now());
