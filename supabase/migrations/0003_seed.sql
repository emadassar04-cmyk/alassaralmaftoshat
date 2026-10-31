-- Seed: placeholder data. Replace phone numbers / addresses / hours from the dashboard (store_settings, branches).
insert into public.branches (slug, name, address, whatsapp, phone, hours, map_url, sort) values
 ('deir-al-balah','فرع دير البلح','العنوان قيد التحديث','+970590000000','0590000000','أوقات الدوام قيد التحديث','',1),
 ('nuseirat','فرع النصيرات','العنوان قيد التحديث','+970590000001','0590000001','أوقات الدوام قيد التحديث','',2);

insert into public.categories (slug, name, description, image_url, sort) values
 ('wajh-farsha','وجه فرشات','أوجه فرشات بأقمشة فاخرة تدوم','/img/c/wajh-farsha.webp',1),
 ('pillows','مخدات','راحة نوم وزينة لغرفتك','/img/c/pillows.webp',2),
 ('sheets','شراشف','قطن وساتان بألوان هادئة','/img/c/sheets.webp',3),
 ('curtains','ستائر','تفصيل على مقاس شبابيكك','/img/c/curtains.webp',4),
 ('foam-mattresses','فرشات إسفنج','إسفنج طبي بكثافات مختلفة','/img/c/foam-mattresses.webp',5),
 ('arabic-sofa','كنب عربي','جلسة عربية أصيلة بلمسة حديثة','/img/c/arabic-sofa.webp',6),
 ('arabic-majlis','فرش عربي','تفصيل كامل حسب شكل المجلس','/img/c/arabic-majlis.webp',7),
 ('batana','باطنة','تفصيل بالطول والعرض والسماكة','/img/c/batana.webp',8);

with p(slug,name,cat,descr,base,sale,custom,best,sort) as (values
 ('wajh-farsha-qutn-malaki','وجه فرشة قطن ملكي','wajh-farsha','وجه فرشة من القطن الملكي الناعم، يحافظ على لونه بعد الغسيل.',95,null,false,true,1),
 ('wajh-farsha-satan-mutarraz','وجه فرشة ساتان مطرّز','wajh-farsha','ساتان لامع بتطريز دقيق يعطي غرفتك طابعاً فاخراً.',150,120,false,false,2),
 ('makhadda-reesh-fakhira','مخدة ريش صناعي فاخرة','pillows','حشوة ريش صناعي منفوشة تعطي دعماً ناعماً للرأس والرقبة.',45,null,false,true,3),
 ('makhadda-tibbiyya','مخدة طبية مريحة','pillows','إسفنج ذاكرة يتشكل مع الرقبة لنوم مريح.',70,null,false,false,4),
 ('taqm-makhaddat-zeena-makhmal','طقم مخدات زينة مخمل','pillows','أربع مخدات زينة من المخمل بألوان متناسقة.',110,null,false,false,5),
 ('sharshaf-qutn-misri','شرشف قطن مصري 4 قطع','sheets','طقم شرشف قطن مصري عالي الكثافة، 4 قطع.',130,null,false,true,6),
 ('sharshaf-satan-harir','شرشف ساتان حرير','sheets','ملمس حريري بارد في الصيف، لمعة هادئة.',190,160,false,false,7),
 ('sharshaf-battaniyya-shatwi','شرشف بطانية شتوي','sheets','دفء الشتاء بوزن خفيف وألوان دافئة.',160,null,false,false,8),
 ('farsha-isfenj-tibbi-10','فرشة إسفنج طبي 10 سم','foam-mattresses','إسفنج طبي بسماكة 10 سم لدعم متوازن للظهر.',210,null,false,true,9),
 ('farsha-isfenj-kathafa-15','فرشة إسفنج كثافة عالية 15 سم','foam-mattresses','كثافة عالية وسماكة 15 سم تتحمل الاستخدام اليومي.',320,280,false,false,10),
 ('farsha-isfenj-atfal','فرشة إسفنج أطفال','foam-mattresses','فرشة خفيفة وآمنة لسرير الأطفال.',120,null,false,false,11),
 ('kanab-arabi-modern-malaki','كنب عربي مودرن ملكي','arabic-sofa','كنب عربي بتصميم مودرن وإسفنج مضغوط عالي الجودة.',1450,null,false,true,12),
 ('kanab-arabi-bayt-kabeer','كنب عربي للبيت الكبير','arabic-sofa','جلسة واسعة تتسع للعائلة الكبيرة والضيوف.',1900,1750,false,false,13),
 ('misnad-arabi-munfarid','مسند عربي منفرد','arabic-sofa','مسند منفرد بقماش متين يكمّل جلستك.',85,null,false,false,14),
 ('sataer-mufassala-makhmal','ستائر مفصّلة قماش مخمل','curtains','ستائر مخمل تُفصَّل حسب قياسات شبابيكك بالضبط.',60,null,true,true,15),
 ('sataer-mufassala-shifon','ستائر مفصّلة شيفون مع بلاك آوت','curtains','طبقة شيفون خفيفة مع طبقة تعتيم، بقياسك.',75,null,true,false,16),
 ('farsh-arabi-mufassal','فرش عربي مفصّل على المقاس','arabic-majlis','نفصّل فرش مجلسك حسب شكله: مستقيم أو L أو U أو غرفة كاملة.',350,null,true,true,17),
 ('batana-mufassala','باطنة مفصّلة','batana','باطنة بالطول والعرض والسماكة التي تحتاجها.',90,null,true,false,18)
), ins as (
 insert into public.products (slug,name,description,category_id,base_price,sale_price,is_custom,is_bestseller,sort)
 select p.slug,p.name,p.descr,c.id,p.base,p.sale,p.custom,p.best,p.sort from p join public.categories c on c.slug=p.cat returning id, slug
)
insert into public.product_images (product_id, url, alt, sort)
select ins.id, '/img/p/'||ins.slug||'.webp', p.name, 0 from ins join p on p.slug=ins.slug;

-- variants (non-custom: stock tracked; custom: fabric options, stock ignored)
insert into public.product_variants (product_id, label, color, size, fabric, price, stock, sort)
select pr.id, v.label, v.color, v.size, v.fabric, v.price, v.stock, v.sort
from (values
 ('wajh-farsha-qutn-malaki','بيج - 120×200','بيج','120×200',null,95::numeric,20,1),
 ('wajh-farsha-qutn-malaki','بيج - 160×200','بيج','160×200',null,120,15,2),
 ('wajh-farsha-qutn-malaki','رمادي - 180×200','رمادي','180×200',null,140,10,3),
 ('wajh-farsha-satan-mutarraz','ذهبي - 160×200','ذهبي','160×200',null,null,12,1),
 ('wajh-farsha-satan-mutarraz','كحلي - 180×200','كحلي','180×200',null,null,8,2),
 ('makhadda-reesh-fakhira','أبيض','أبيض','50×70',null,null,40,1),
 ('makhadda-tibbiyya','أبيض','أبيض','40×60',null,null,25,1),
 ('taqm-makhaddat-zeena-makhmal','زيتي','زيتي',null,'مخمل',null,18,1),
 ('taqm-makhaddat-zeena-makhmal','نحاسي','نحاسي',null,'مخمل',null,18,2),
 ('taqm-makhaddat-zeena-makhmal','كريمي','كريمي',null,'مخمل',null,18,3),
 ('sharshaf-qutn-misri','أبيض - سرير مفرد','أبيض','مفرد',null,130,20,1),
 ('sharshaf-qutn-misri','أبيض - سرير مزدوج','أبيض','مزدوج',null,170,20,2),
 ('sharshaf-satan-harir','شمبانيا','شمبانيا','مزدوج',null,null,14,1),
 ('sharshaf-satan-harir','رمادي فاتح','رمادي','مزدوج',null,null,14,2),
 ('sharshaf-battaniyya-shatwi','بني','بني','مزدوج',null,null,16,1),
 ('farsha-isfenj-tibbi-10','90×190','','90×190',null,210,10,1),
 ('farsha-isfenj-tibbi-10','120×190','','120×190',null,270,10,2),
 ('farsha-isfenj-tibbi-10','160×200','','160×200',null,340,8,3),
 ('farsha-isfenj-kathafa-15','160×200','','160×200',null,null,6,1),
 ('farsha-isfenj-atfal','60×120','','60×120',null,null,15,1),
 ('kanab-arabi-modern-malaki','طقم كامل - بيج','بيج','طقم كامل',null,null,3,1),
 ('kanab-arabi-modern-malaki','طقم كامل - رمادي','رمادي','طقم كامل',null,null,3,2),
 ('kanab-arabi-bayt-kabeer','طقم كبير - زيتي','زيتي','طقم كبير',null,null,2,1),
 ('misnad-arabi-munfarid','بيج','بيج',null,null,null,30,1),
 ('sataer-mufassala-makhmal','مخمل عادي','','','مخمل عادي',60,0,1),
 ('sataer-mufassala-makhmal','مخمل مضغوط','','','مخمل مضغوط',80,0,2),
 ('sataer-mufassala-shifon','شيفون + بلاك آوت','','','شيفون + بلاك آوت',75,0,1),
 ('farsh-arabi-mufassal','إسفنج 8 سم - قماش عادي','','','قماش عادي',350,0,1),
 ('farsh-arabi-mufassal','إسفنج 10 سم - قماش مخمل','','','قماش مخمل',450,0,2),
 ('batana-mufassala','إسفنج طبي','','','إسفنج طبي',90,0,1)
) as v(slug,label,color,size,fabric,price,stock,sort) join public.products pr on pr.slug=v.slug;

-- measurement schemas (per product, editable from the dashboard)
update public.products set measurement_schema = '{"diagram":"curtains","fields":[
 {"key":"width_cm","label":"عرض الشباك (سم)","type":"number","hint":"قِس عرض الشباك من أقصى اليمين لأقصى اليسار"},
 {"key":"height_from","label":"القياس من","type":"select","options":["من السقف","من الشباك"]},
 {"key":"height_cm","label":"الارتفاع (سم)","type":"number","hint":"من السقف أو أعلى الشباك حتى الأرض أو الموضع المطلوب"},
 {"key":"windows_count","label":"عدد الشبابيك","type":"number"},
 {"key":"opening","label":"نوع الفتح","type":"select","options":["من جهة","من الجهتين"]},
 {"key":"layers","label":"الطبقات","type":"select","options":["طبقة واحدة","مع شيفون"]}]}'::jsonb
 where slug in ('sataer-mufassala-makhmal','sataer-mufassala-shifon');
update public.products set measurement_schema = '{"diagram":"majlis","fields":[
 {"key":"layout","label":"شكل الجلسة","type":"select","options":["خط مستقيم","L","U","غرفة كاملة"]},
 {"key":"side_a_cm","label":"طول الضلع الأول (سم)","type":"number"},
 {"key":"side_b_cm","label":"طول الضلع الثاني (سم)","type":"number","showIf":{"key":"layout","in":["L","U","غرفة كاملة"]}},
 {"key":"side_c_cm","label":"طول الضلع الثالث (سم)","type":"number","showIf":{"key":"layout","in":["U","غرفة كاملة"]}},
 {"key":"side_d_cm","label":"طول الضلع الرابع (سم)","type":"number","showIf":{"key":"layout","in":["غرفة كاملة"]}},
 {"key":"backrests","label":"عدد المساند","type":"number"},
 {"key":"cushions","label":"عدد المخدات","type":"number"},
 {"key":"foam_type","label":"نوع الإسفنج","type":"select","options":["عادي","كثافة عالية","طبي"]},
 {"key":"foam_thickness","label":"سماكة الإسفنج","type":"select","options":["8 سم","10 سم","12 سم"]}]}'::jsonb
 where slug = 'farsh-arabi-mufassal';
update public.products set measurement_schema = '{"diagram":"batana","fields":[
 {"key":"length_cm","label":"الطول (سم)","type":"number"},
 {"key":"width_cm","label":"العرض (سم)","type":"number"},
 {"key":"thickness_cm","label":"السماكة (سم)","type":"number"}]}'::jsonb
 where slug = 'batana-mufassala';

insert into public.store_settings (key, value) values
 ('home', '{"headline":"مفروشات العصار","tagline":"بيتك يستاهل الأفخم","badge":"30 عاماً من الثقة · فرعان في دير البلح والنصيرات"}'),
 ('payment_accounts', '{"palpay":{"account":"قيد التحديث","holder":""},"jawwal_pay":{"account":"قيد التحديث","holder":""},"bank_palestine":{"account":"قيد التحديث","holder":""}}'),
 ('meta_pixel_id', '""'),
 ('testimonials', '[{"name":"أم محمد","text":"قماش ممتاز وتفصيل الستائر طلع بالضبط على المقاس. أنصح بهم.","place":"دير البلح"},{"name":"أبو أحمد","text":"فرش عربي مريح وشغل نظيف، والتوصيل كان بالموعد.","place":"النصيرات"},{"name":"سلمى","text":"اشتريت شراشف وفرشة إسفنج، الجودة تستاهل السعر.","place":"دير البلح"}]');

insert into public.posts (slug, title, excerpt, body, published) values
 ('how-to-measure-curtains','كيف تقيس شباكك لتفصيل الستائر','خطوات بسيطة لقياس صحيح قبل التفصيل.','قِس عرض الشباك من أقصى طرفيه، ثم أضف 20 إلى 30 سم من كل جهة ليعطي القماش تكسّراً أنيقاً. أما الارتفاع فقِسه من السقف إلى الموضع الذي تريد أن تنتهي عنده الستارة. استعمل شريط قياس معدني، وسجّل القياس بالسنتيمتر.',true),
 ('choosing-foam-mattress','كيف تختار فرشة الإسفنج المناسبة','الكثافة والسماكة وعلاقتها بالراحة.','كلما زادت كثافة الإسفنج زادت مدة تحمّله للاستخدام. للنوم اليومي ننصح بسماكة 10 سم على الأقل وكثافة متوسطة إلى عالية، وللجلسات العربية 8 إلى 12 سم حسب الاستخدام.',true),
 ('caring-for-fabrics','العناية بالأقمشة وإطالة عمرها','نصائح للغسيل والتخزين.','اغسل القطن بماء فاتر وتجنب التجفيف تحت الشمس المباشرة للألوان الداكنة. المخمل يُنظَّف بفرشاة ناعمة، والساتان يُغسل على الوجه المعكوس.',true);
