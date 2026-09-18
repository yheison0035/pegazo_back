-- ============================================================================
-- Contenido de productos · SALUD + DEPORTES (formato Mercado Libre / televentas)
-- Descripción + características (InventoryFeature) + especificaciones. Idempotente.
-- ============================================================================

-- ═══════════════ SALUD ═══════════════

UPDATE "Inventory" SET description='<p>Descansa mejor y despierta sin dolor de cuello. La <strong>almohada de gel</strong> combina espuma cómoda con una capa de gel refrescante que mantiene la cabeza fresca toda la noche y se adapta a tu postura. Ideal para dormir de lado o boca arriba.</p>' WHERE id=43;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=43;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Capa de gel refrescante que disipa el calor',43,0,true,now()),('Se adapta a tu cuello y hombros',43,1,true,now()),('Ayuda a aliviar tensiones al dormir',43,2,true,now()),('Cómoda para dormir de lado o boca arriba',43,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=43;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Material','Espuma + gel refrescante',43,0,true,now()),('Uso','Descanso / cervical',43,1,true,now()),('Funda','Lavable',43,2,true,now());

UPDATE "Inventory" SET description='<p>Endereza tu espalda sin esfuerzo. El <strong>corrector de postura recargable</strong> se ajusta al cuerpo y, con recordatorio de vibración, te avisa cuando te encorvas para que corrijas la posición. Recargable por USB y cómodo de usar bajo la ropa.</p>' WHERE id=47;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=47;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Recordatorio de vibración cuando te encorvas',47,0,true,now()),('Recargable por USB',47,1,true,now()),('Ajustable y discreto bajo la ropa',47,2,true,now()),('Ayuda a corregir la postura de espalda y hombros',47,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=47;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Alimentación','Recargable por USB',47,0,true,now()),('Función','Corrector con vibración',47,1,true,now()),('Uso','Espalda / hombros',47,2,true,now());

UPDATE "Inventory" SET description='<p><strong>Esencia aromática</strong> para tu humidificador o difusor: unas gotas en el agua y tu espacio se llena de un aroma agradable que ayuda a relajar el ambiente en casa u oficina.</p>' WHERE id=148;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=148;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Aroma agradable para relajar el ambiente',148,0,true,now()),('Ideal para humidificadores y difusores',148,1,true,now()),('Rinde: solo unas gotas por uso',148,2,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=148;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Uso','Humidificador / difusor',148,0,true,now()),('Presentación','Esencia aromática',148,1,true,now());

UPDATE "Inventory" SET description='<p>Relaja tu vista después de horas de pantalla. Las <strong>gafas masajeadoras</strong> aplican masaje suave por vibración y calor alrededor de los ojos para aliviar el cansancio y la tensión. Recargables y con diseño plegable para llevar a cualquier parte.</p>' WHERE id=390;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=390;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje con vibración y calor para el contorno de ojos',390,0,true,now()),('Alivia el cansancio visual y la tensión',390,1,true,now()),('Recargables por USB',390,2,true,now()),('Diseño plegable y liviano',390,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=390;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Funciones','Vibración + calor',390,0,true,now()),('Alimentación','Recargable por USB',390,1,true,now()),('Uso','Masaje ocular / relajación',390,2,true,now());

UPDATE "Inventory" SET description='<p>Tu gimnasio en casa, sin máquinas grandes. Este <strong>set de bandas de resistencia</strong> soporta hasta 220 kg de tensión y te permite entrenar todo el cuerpo: brazos, pecho, espalda, piernas y glúteos. Incluye accesorios y es fácil de guardar.</p>' WHERE id=5;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=5;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Resistencia de hasta 220 kg para entrenar fuerte',5,0,true,now()),('Ejercita todo el cuerpo en casa',5,1,true,now()),('Incluye accesorios (agarres, anclajes y tobilleras)',5,2,true,now()),('Fácil de guardar y transportar',5,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=5;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Resistencia máx.','Hasta 220 kg',5,0,true,now()),('Uso','Entrenamiento de fuerza en casa',5,1,true,now()),('Incluye','Bandas + accesorios',5,2,true,now());

UPDATE "Inventory" SET description='<p>Alivia la tensión del cuello y hombros en casa o en la oficina. El <strong>masajeador cervical</strong> aplica masaje relajante en la zona cervical para descargar el estrés del día. Práctico y fácil de usar en cualquier momento.</p>' WHERE id=3;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=3;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje relajante para cuello y hombros',3,0,true,now()),('Alivia la tensión y el estrés',3,1,true,now()),('Práctico para casa u oficina',3,2,true,now()),('Fácil de usar',3,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=3;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Zona','Cuello / cervical',3,0,true,now()),('Función','Masaje relajante',3,1,true,now());

UPDATE "Inventory" SET description='<p>Manos cansadas de escribir o trabajar todo el día. El <strong>masajeador de manos</strong> aplica presión y calor para relajar dedos, palmas y muñecas, mejorando la circulación. Recargable y cómodo de usar en casa.</p>' WHERE id=408;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=408;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje por presión y calor para las manos',408,0,true,now()),('Ayuda a relajar dedos, palmas y muñecas',408,1,true,now()),('Favorece la circulación',408,2,true,now()),('Recargable por USB',408,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=408;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Zona','Manos / muñecas',408,0,true,now()),('Funciones','Presión + calor',408,1,true,now()),('Alimentación','Recargable por USB',408,2,true,now());

UPDATE "Inventory" SET description='<p>Descarga los músculos como un profesional. La <strong>pistola masajeadora frío-calor</strong> combina percusión con terapia de frío y calor para aliviar dolores, relajar y recuperar después del ejercicio. Incluye varios cabezales y es recargable.</p>' WHERE id=6;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=6;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje de percusión con frío y calor',6,0,true,now()),('Alivia dolores y relaja los músculos',6,1,true,now()),('Ideal para recuperación después del ejercicio',6,2,true,now()),('Recargable y con varios cabezales',6,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=6;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Funciones','Percusión + frío/calor',6,0,true,now()),('Alimentación','Recargable',6,1,true,now()),('Incluye','Varios cabezales',6,2,true,now());

UPDATE "Inventory" SET description='<p>Alivia tus músculos con solo un botón. Esta <strong>pistola masajeadora frío-calor</strong> ofrece masaje de percusión potente con terapia de frío y calor, y control por botón para cambiar de intensidad. Recargable, con varios cabezales para cada zona del cuerpo.</p>' WHERE id=419;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=419;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje de percusión con frío y calor',419,0,true,now()),('Control por botón para cambiar intensidad',419,1,true,now()),('Varios cabezales intercambiables',419,2,true,now()),('Recargable por USB',419,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=419;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Funciones','Percusión + frío/calor',419,0,true,now()),('Control','Por botón',419,1,true,now()),('Alimentación','Recargable por USB',419,2,true,now());

UPDATE "Inventory" SET description='<p>Masaje donde sea, sin cables largos. Este <strong>masajeador portátil</strong> viene en su caja lista para usar y aplica masaje de percusión para aliviar la tensión de cuello, espalda y piernas. Compacto, recargable y fácil de llevar.</p>' WHERE id=420;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=420;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje de percusión para varias zonas',420,0,true,now()),('Compacto y portátil',420,1,true,now()),('Recargable por USB',420,2,true,now()),('Listo para usar en su estuche',420,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=420;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador portátil',420,0,true,now()),('Alimentación','Recargable por USB',420,1,true,now()),('Uso','Cuello, espalda, piernas',420,2,true,now());

UPDATE "Inventory" SET description='<p>Controla tu presión arterial en casa de forma fácil. Este <strong>monitor de presión con función de voz</strong> mide presión y pulso, y te dice los resultados en voz alta, ideal para adultos mayores. Pantalla grande y memoria de mediciones.</p>' WHERE id=25;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=25;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Función de voz: dice los resultados en voz alta',25,0,true,now()),('Mide presión arterial y pulso',25,1,true,now()),('Pantalla grande fácil de leer',25,2,true,now()),('Guarda mediciones en memoria',25,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=25;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Mide','Presión arterial + pulso',25,0,true,now()),('Función','Voz + memoria',25,1,true,now()),('Colocación','Brazo',25,2,true,now());

UPDATE "Inventory" SET description='<p>Mide tu presión en cualquier lugar. Este <strong>monitor de presión mini</strong> es compacto y fácil de usar: colócalo, presiona y obtén tu presión y pulso en segundos. Práctico para llevar y controlar tu salud a diario.</p>' WHERE id=411;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=411;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Diseño mini y portátil',411,0,true,now()),('Mide presión arterial y pulso',411,1,true,now()),('Fácil de usar en segundos',411,2,true,now()),('Ideal para llevar contigo',411,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=411;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Mide','Presión arterial + pulso',411,0,true,now()),('Tipo','Monitor compacto',411,1,true,now());

-- ═══════════════ DEPORTES ═══════════════

UPDATE "Inventory" SET description='<p>Controla tu peso y tu progreso desde el celular. La <strong>báscula inteligente Bluetooth</strong> se conecta a una app y te muestra peso e indicadores corporales con solo pararte encima. Diseño delgado en vidrio templado para tu baño.</p>' WHERE id=9;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=9;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Se conecta por Bluetooth a una app',9,0,true,now()),('Muestra peso e indicadores corporales',9,1,true,now()),('Superficie en vidrio templado resistente',9,2,true,now()),('Encendido automático al subirte',9,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=9;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Conexión','Bluetooth + app',9,0,true,now()),('Material','Vidrio templado',9,1,true,now()),('Alimentación','Pilas',9,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>camisilla deportiva</strong> de compresión ayuda a moldear la figura y a mantenerte firme durante el día o el entrenamiento. Tela elástica y transpirable que se ajusta al cuerpo con comodidad.</p>' WHERE id=50;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=50;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Efecto de compresión que moldea la figura',50,0,true,now()),('Tela elástica y transpirable',50,1,true,now()),('Cómoda para uso diario o deporte',50,2,true,now()),('Se ajusta al cuerpo',50,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=50;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Camisilla de compresión',50,0,true,now()),('Material','Tela elástica transpirable',50,1,true,now());

UPDATE "Inventory" SET description='<p>Marca cintura y luce más estilizada al instante. La <strong>cinturilla reductora</strong> comprime el abdomen, mejora la postura y ayuda a moldear la figura mientras haces tus actividades o ejercicio. Ajustable y cómoda.</p>' WHERE id=51;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=51;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Comprime el abdomen y marca la cintura',51,0,true,now()),('Ayuda a moldear la figura',51,1,true,now()),('Mejora la postura al usarla',51,2,true,now()),('Ajustable y cómoda',51,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=51;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cinturilla reductora',51,0,true,now()),('Ajuste','Regulable',51,1,true,now()),('Uso','Diario / ejercicio',51,2,true,now());

UPDATE "Inventory" SET description='<p>Silueta de reloj de arena con la <strong>faja moldeadora</strong>. Comprime cintura y abdomen para estilizar la figura de inmediato bajo cualquier prenda. Tela firme y elástica que se ajusta con comodidad.</p>' WHERE id=46;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=46;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Efecto reloj de arena que estiliza la figura',46,0,true,now()),('Comprime cintura y abdomen',46,1,true,now()),('Se usa bajo cualquier prenda',46,2,true,now()),('Tela firme y elástica',46,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=46;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Faja moldeadora',46,0,true,now()),('Uso','Moldear cintura y abdomen',46,1,true,now());

UPDATE "Inventory" SET description='<p>Entrena todo el cuerpo en casa con este <strong>set de bandas de resistencia</strong> de hasta 110 kg. Ideal para tonificar brazos, piernas y glúteos sin necesidad de máquinas. Incluye accesorios y se guarda en cualquier rincón.</p>' WHERE id=53;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=53;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Resistencia de hasta 110 kg',53,0,true,now()),('Tonifica todo el cuerpo en casa',53,1,true,now()),('Incluye accesorios de entrenamiento',53,2,true,now()),('Fácil de guardar y llevar',53,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=53;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Resistencia máx.','Hasta 110 kg',53,0,true,now()),('Uso','Entrenamiento en casa',53,1,true,now()),('Incluye','Bandas + accesorios',53,2,true,now());

UPDATE "Inventory" SET description='<p>Terapia de ventosas en casa. Este <strong>juego de ventosas de succión</strong> ayuda a relajar músculos, activar la circulación y aliviar tensiones, al estilo de las terapias profesionales. Fácil de aplicar y reutilizable.</p>' WHERE id=45;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=45;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Terapia de ventosas para relajar músculos',45,0,true,now()),('Ayuda a activar la circulación',45,1,true,now()),('Succión regulable y reutilizable',45,2,true,now()),('Fácil de aplicar en casa',45,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=45;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Ventosas de succión',45,0,true,now()),('Uso','Terapia / relajación muscular',45,1,true,now());

UPDATE "Inventory" SET description='<p>Relaja tu cuerpo después de un día pesado. El <strong>masajeador corporal Body Innovation</strong> aplica vibración en distintas zonas para descargar tensiones de espalda, piernas y cuello. Fácil de usar y cómodo de sostener.</p>' WHERE id=44;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=44;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje por vibración para todo el cuerpo',44,0,true,now()),('Descarga tensiones de espalda, piernas y cuello',44,1,true,now()),('Fácil de sostener y usar',44,2,true,now()),('Varias intensidades',44,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=44;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador corporal',44,0,true,now()),('Función','Vibración',44,1,true,now());

UPDATE "Inventory" SET description='<p>Un cojín que te da masaje donde más lo necesitas. El <strong>cojín masajeador</strong> aplica masaje shiatsu con calor sobre cuello, espalda o piernas; solo lo apoyas y te relajas. Ideal para el sofá, la cama o el carro.</p>' WHERE id=39;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=39;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje shiatsu con calor',39,0,true,now()),('Se usa en cuello, espalda o piernas',39,1,true,now()),('Ideal para sofá, cama o carro',39,2,true,now()),('Solo apóyalo y relájate',39,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=39;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cojín masajeador',39,0,true,now()),('Funciones','Shiatsu + calor',39,1,true,now());

UPDATE "Inventory" SET description='<p>Masaje divertido y efectivo con el <strong>masajeador con forma de delfín</strong> de 8 puntas. Sus cabezales giratorios relajan cuello, espalda y piernas con distintas intensidades. Práctico y fácil de usar en casa.</p>' WHERE id=142;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=142;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('8 puntas giratorias para un masaje profundo',142,0,true,now()),('Relaja cuello, espalda y piernas',142,1,true,now()),('Varias intensidades',142,2,true,now()),('Diseño práctico tipo delfín',142,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=142;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Masajeador 8 puntas',142,0,true,now()),('Uso','Cuello, espalda, piernas',142,1,true,now());

UPDATE "Inventory" SET description='<p>Tonifica tus músculos sin esfuerzo. El <strong>parche masajeador con forma de mariposa</strong> usa electroestimulación (EMS) para estimular la zona del abdomen, brazos o piernas. Compacto, inalámbrico y fácil de pegar donde quieras.</p>' WHERE id=42;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=42;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Electroestimulación (EMS) para tonificar',42,0,true,now()),('Se pega en abdomen, brazos o piernas',42,1,true,now()),('Compacto e inalámbrico',42,2,true,now()),('Varios modos e intensidades',42,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=42;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Parche EMS',42,0,true,now()),('Uso','Tonificación muscular',42,1,true,now());

UPDATE "Inventory" SET description='<p>Descarga muscular en casa como un profesional. La <strong>pistola masajeadora de 4 puntas</strong> incluye varios cabezales para tratar cada zona del cuerpo con masaje de percusión. Recargable, potente y fácil de manejar.</p>' WHERE id=36;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=36;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Masaje de percusión potente',36,0,true,now()),('Incluye 4 cabezales para cada zona',36,1,true,now()),('Ideal para relajar y recuperar músculos',36,2,true,now()),('Recargable por USB',36,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=36;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Pistola de masaje',36,0,true,now()),('Cabezales','4 intercambiables',36,1,true,now()),('Alimentación','Recargable',36,2,true,now());

UPDATE "Inventory" SET name='MASAJEADOR GIMNASIA PASIVA', description='<p>Ejercita tus músculos sin moverte con el <strong>masajeador de gimnasia pasiva</strong>. Mediante electroestimulación tonifica y relaja distintas zonas del cuerpo mientras descansas. Con varios modos e intensidades para tu rutina.</p>' WHERE id=41;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=41;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Electroestimulación para tonificar sin esfuerzo',41,0,true,now()),('Trabaja el músculo mientras descansas',41,1,true,now()),('Varios modos e intensidades',41,2,true,now()),('Fácil de usar en casa',41,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=41;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Gimnasia pasiva (EMS)',41,0,true,now()),('Uso','Tonificación muscular',41,1,true,now());

UPDATE "Inventory" SET description='<p>Fortalece tu abdomen y tren superior con la <strong>rueda abdominal</strong>. Un ejercicio simple y efectivo para trabajar el core, los brazos y la espalda en casa. Agarres cómodos y antideslizantes para entrenar seguro.</p>' WHERE id=26;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=26;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Trabaja abdomen, brazos y espalda',26,0,true,now()),('Ejercicio simple y efectivo para el core',26,1,true,now()),('Agarres cómodos y antideslizantes',26,2,true,now()),('Compacta para entrenar en casa',26,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=26;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Rueda abdominal',26,0,true,now()),('Uso','Core / abdomen',26,1,true,now());

UPDATE "Inventory" SET description='<p>Activa y tonifica tu cuerpo con la banda vibratoria <strong>Vibro Shape</strong>. Su vibración ayuda a estimular los músculos de cintura, glúteos y piernas mientras la usas de pie. Práctica para complementar tu rutina en casa.</p>' WHERE id=38;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=38;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Vibración que estimula cintura, glúteos y piernas',38,0,true,now()),('Complementa tu rutina de ejercicio',38,1,true,now()),('Fácil de usar de pie',38,2,true,now()),('Varias intensidades',38,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=38;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Banda vibratoria',38,0,true,now()),('Uso','Tonificación / reductor',38,1,true,now());
