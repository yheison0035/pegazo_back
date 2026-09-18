-- ============================================================================
-- Contenido · BELLEZA MUJER (tanda 1: herramientas de cabello y belleza).
-- Descripción + características + specs. Idempotente. No se cambian nombres.
-- ============================================================================

UPDATE "Inventory" SET description='<p>Alisa tu cabello mientras lo cepillas con el <strong>cepillo alisador</strong>. Sus placas se calientan para dejar el pelo liso, suave y con brillo en pocas pasadas, sin tirones. Rápido, fácil y seguro para el uso diario.</p>' WHERE id=56;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=56;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Alisa mientras cepillas, sin tirones',56,0,true,now()),('Placas que calientan para un liso duradero',56,1,true,now()),('Rápido y fácil de usar',56,2,true,now()),('Cabello suave y con brillo',56,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=56;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo alisador eléctrico',56,0,true,now()),('Uso','Alisar cabello',56,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>cepillo secador</strong> seca y moldea tu cabello al mismo tiempo, dándole volumen y forma en una sola pasada. Ideal para un peinado con acabado de salón en casa, ahorrando tiempo.</p>' WHERE id=54;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=54;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Seca y moldea al mismo tiempo',54,0,true,now()),('Da volumen y forma',54,1,true,now()),('Acabado de salón en casa',54,2,true,now()),('Ahorra tiempo en el peinado',54,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=54;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo secador',54,0,true,now()),('Uso','Secar y moldear',54,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>cepillo secador giratorio</strong> gira mientras seca para moldear, dar volumen y ondas con facilidad. Deja tu cabello liso o con movimiento, con un acabado profesional sin ir a la peluquería.</p>' WHERE id=384;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=384;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cabezal giratorio que moldea solo',384,0,true,now()),('Da volumen, ondas y liso',384,1,true,now()),('Seca y peina a la vez',384,2,true,now()),('Acabado profesional en casa',384,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=384;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo secador giratorio',384,0,true,now()),('Uso','Secar, moldear y dar volumen',384,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>cepillo secador con cerdas de keratina Lemman</strong> seca, alisa y da brillo en una sola pasada. Sus cerdas ayudan a sellar la cutícula para un cabello más suave, liso y sin frizz. Acabado de salón en casa.</p>' WHERE id=167;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=167;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Cerdas con keratina para más brillo',167,0,true,now()),('Seca, alisa y controla el frizz',167,1,true,now()),('Cabello suave en una sola pasada',167,2,true,now()),('Marca Lemman',167,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=167;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Lemman',167,0,true,now()),('Tipo','Cepillo secador de keratina',167,1,true,now()),('Uso','Secar, alisar, dar brillo',167,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>cepillo secador y modelador Avocado 3D</strong> seca y le da forma a tu cabello con su diseño ergonómico que llega a la raíz. Da volumen, alisa y ondula con un acabado suave y con brillo.</p>' WHERE id=255;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=255;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Seca y moldea con diseño 3D',255,0,true,now()),('Da volumen, alisa y ondula',255,1,true,now()),('Llega a la raíz para más volumen',255,2,true,now()),('Acabado suave y con brillo',255,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=255;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Cepillo secador y modelador',255,0,true,now()),('Uso','Secar, moldear, dar volumen',255,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>combo de plancha y rizadora Lemman</strong> te da dos herramientas para peinar como quieras: alisa con la plancha o marca rizos y ondas con la rizadora. Placas cerámicas que cuidan el cabello y calientan rápido.</p>' WHERE id=67;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=67;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: plancha + rizadora',67,0,true,now()),('Alisa, riza y ondula',67,1,true,now()),('Placas cerámicas que cuidan el cabello',67,2,true,now()),('Marca Lemman',67,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=67;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Lemman',67,0,true,now()),('Incluye','Plancha + rizadora',67,1,true,now()),('Placas','Cerámicas',67,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>combo de secador y rizador</strong> reúne lo esencial para tu peinado: seca el cabello con potencia y marca rizos u ondas con el rizador. Ideal para lograr distintos looks en casa.</p>' WHERE id=352;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=352;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: secador + rizador',352,0,true,now()),('Seca con potencia y marca rizos',352,1,true,now()),('Varios looks en casa',352,2,true,now()),('Fácil de usar',352,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=352;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Incluye','Secador + rizador',352,0,true,now()),('Uso','Secar y rizar',352,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>combo de secador y tenaza sirena</strong> te da un secador potente más una tenaza de ondas tipo sirena para lograr ese efecto de olas marcado y moderno. Todo para un peinado de impacto en casa.</p>' WHERE id=351;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=351;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('2 en 1: secador + tenaza sirena',351,0,true,now()),('Ondas tipo sirena marcadas',351,1,true,now()),('Seca con potencia',351,2,true,now()),('Peinados modernos en casa',351,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=351;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Incluye','Secador + tenaza de ondas',351,0,true,now()),('Uso','Secar y ondular',351,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>moldeador Geemy 4 en 1 para mujer</strong> reúne varios accesorios para alisar, rizar y dar volumen con una sola herramienta. Ideal para cambiar de look sin comprar varios aparatos. Placas que cuidan el cabello.</p>' WHERE id=387;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=387;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('4 en 1: alisa, riza y da volumen',387,0,true,now()),('Varios accesorios intercambiables',387,1,true,now()),('Un solo aparato para varios looks',387,2,true,now()),('Marca Geemy',387,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=387;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Geemy',387,0,true,now()),('Tipo','Moldeador 4 en 1',387,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>plancha de cabello Lemman</strong> alisa tu pelo con placas cerámicas que calientan rápido y se deslizan suave, sin maltratar. Deja el cabello liso, sedoso y con brillo. Temperatura ideal para el uso diario.</p>' WHERE id=49;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=49;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Placas cerámicas que cuidan el cabello',49,0,true,now()),('Calienta rápido y se desliza suave',49,1,true,now()),('Cabello liso, sedoso y con brillo',49,2,true,now()),('Marca Lemman',49,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=49;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Lemman',49,0,true,now()),('Tipo','Plancha de cabello',49,1,true,now()),('Placas','Cerámicas',49,2,true,now());

UPDATE "Inventory" SET description='<p>La <strong>plancha de cabello con placas cerámicas</strong> alisa tu pelo de forma rápida y con acabado profesional. Sus placas se deslizan suave para un liso sedoso y con brillo, calentando en segundos.</p>' WHERE id=433;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=433;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Placas cerámicas para un liso profesional',433,0,true,now()),('Calienta en segundos',433,1,true,now()),('Se desliza suave, sin tirones',433,2,true,now()),('Cabello sedoso y con brillo',433,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=433;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Plancha de cabello',433,0,true,now()),('Placas','Cerámicas',433,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>plancha vertical a vapor Shuangbao</strong> desarruga tu ropa colgada con vapor, sin necesidad de tabla. Ideal para camisas, vestidos y cortinas; calienta rápido y es práctica para casa o viaje.</p>' WHERE id=380;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=380;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Desarruga la ropa colgada, sin tabla',380,0,true,now()),('Ideal para camisas, vestidos y cortinas',380,1,true,now()),('Calienta rápido',380,2,true,now()),('Práctica para casa o viaje',380,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=380;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Shuangbao',380,0,true,now()),('Tipo','Plancha vertical a vapor',380,1,true,now()),('Uso','Ropa colgada',380,2,true,now());

UPDATE "Inventory" SET description='<p>El <strong>rizador 5 en 1</strong> trae varios accesorios para crear rizos, ondas y volumen de distintos tamaños. Una sola herramienta para cambiar de look cuando quieras, con placas que cuidan el cabello.</p>' WHERE id=395;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=395;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('5 accesorios para rizos y ondas',395,0,true,now()),('Rizos de distintos tamaños',395,1,true,now()),('Un solo aparato para varios looks',395,2,true,now()),('Placas que cuidan el cabello',395,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=395;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Rizador / moldeador 5 en 1',395,0,true,now()),('Uso','Rizar y ondular',395,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>rizadora Nova</strong> marca rizos y ondas definidas de forma fácil y rápida. Calienta pronto y mantiene la forma por más tiempo, para un peinado con movimiento y estilo en casa.</p>' WHERE id=422;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=422;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Rizos y ondas definidas',422,0,true,now()),('Calienta rápido',422,1,true,now()),('El rizo dura más tiempo',422,2,true,now()),('Fácil de usar',422,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=422;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Nova',422,0,true,now()),('Tipo','Rizadora',422,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>secador de cabello BP-5500</strong> seca rápido con buena potencia y varias temperaturas. Deja el cabello suave y con brillo, con boquilla concentradora para un peinado más preciso.</p>' WHERE id=430;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=430;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Buena potencia: seca rápido',430,0,true,now()),('Varias temperaturas y velocidades',430,1,true,now()),('Boquilla concentradora',430,2,true,now()),('Cabello suave y con brillo',430,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=430;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Modelo','BP-5500',430,0,true,now()),('Tipo','Secador de cabello',430,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>secador de cabello Lemman</strong> seca con potencia y cuida el cabello con sus temperaturas ajustables. Práctico y liviano, con boquilla para dirigir el aire y lograr el peinado que buscas.</p>' WHERE id=64;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=64;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Seca con potencia',64,0,true,now()),('Temperaturas y velocidades ajustables',64,1,true,now()),('Liviano y fácil de manejar',64,2,true,now()),('Marca Lemman',64,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=64;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Marca','Lemman',64,0,true,now()),('Tipo','Secador de cabello',64,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>tenaza onduladora "sirena"</strong> crea ondas tipo mar, marcadas y modernas, en pocos minutos. Sus placas onduladas dan ese efecto de olas parejo de raíz a puntas. Calienta rápido y es fácil de usar.</p>' WHERE id=424;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=424;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Ondas tipo sirena, parejas y marcadas',424,0,true,now()),('Placas onduladas para efecto de olas',424,1,true,now()),('Calienta rápido',424,2,true,now()),('Fácil de usar',424,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=424;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Tenaza onduladora (sirena)',424,0,true,now()),('Uso','Ondas',424,1,true,now());

UPDATE "Inventory" SET description='<p>La <strong>tenaza onduladora "sirena" (color aguacate)</strong> logra ondas tipo mar marcadas y con estilo. Sus placas onduladas dan el efecto de olas parejo, y su color aguacate le da un toque moderno. Calienta rápido.</p>' WHERE id=425;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=425;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Ondas tipo sirena, parejas y marcadas',425,0,true,now()),('Diseño color aguacate',425,1,true,now()),('Placas onduladas para efecto de olas',425,2,true,now()),('Calienta rápido',425,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=425;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Tenaza onduladora (sirena)',425,0,true,now()),('Color','Aguacate',425,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>drill de uñas</strong> (torno eléctrico) lima, pule y da forma a las uñas para una manicure y pedicure profesional en casa. Incluye varias puntas para cada acabado. Recargable y fácil de manejar.</p>' WHERE id=63;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=63;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Lima, pule y da forma a las uñas',63,0,true,now()),('Varias puntas para cada acabado',63,1,true,now()),('Manicure y pedicure en casa',63,2,true,now()),('Recargable y fácil de manejar',63,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=63;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Torno / drill de uñas',63,0,true,now()),('Incluye','Varias puntas',63,1,true,now());

UPDATE "Inventory" SET description='<p>El <strong>maletín con espejo</strong> organiza todo tu maquillaje y accesorios en un solo lugar, con espejo incorporado para maquillarte donde quieras. Amplio, resistente y con divisiones para tenerlo todo a la mano.</p>' WHERE id=386;
DELETE FROM "InventoryFeature" WHERE "inventoryId"=386;
INSERT INTO "InventoryFeature"("title","inventoryId","order","visible","createdAt") VALUES
 ('Espejo incorporado',386,0,true,now()),('Divisiones para organizar el maquillaje',386,1,true,now()),('Amplio y resistente',386,2,true,now()),('Ideal para llevar o guardar',386,3,true,now());
DELETE FROM "InventorySpecification" WHERE "inventoryId"=386;
INSERT INTO "InventorySpecification"("key","value","inventoryId","order","visible","createdAt") VALUES
 ('Tipo','Maletín de maquillaje con espejo',386,0,true,now()),('Uso','Organizar maquillaje',386,1,true,now());
