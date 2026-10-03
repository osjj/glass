import { config } from 'dotenv';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { patchArticleLinks, patchSlugs, articleSlugs } from './lib/article-link-patches';
import { copySnapshot } from '../src/lib/product-copy';
import { recordCopyChange } from '../src/lib/product-copy-store';
config({path:'.env',quiet:true}); config({path:'.env.local',quiet:true,override:true});
const root='output/seo-fixes-20261003';
const definitions = [
 '<b>Nominal size:</b> The size stated in the product name or catalog; it is not a sample measurement.',
 '<b>Brimful capacity:</b> The volume held when liquid reaches the agreed rim-level endpoint.',
 '<b>Intended fill volume:</b> The amount poured for the planned use, measured separately from brimful capacity.',
];
const steps = [
 'Set the glass on a level surface and define the brimful endpoint. Use the same endpoint for every sample.',
 'Dry the glass and record its empty mass on a balance suitable for the agreed measurement limits.',
 'Fill with water to the endpoint, record the water temperature and weigh the filled glass.',
 'Subtract the empty mass. Divide the net water mass in grams by water density in g/mL at the recorded temperature to obtain volume in mL.',
 'Repeat for the intended fill level. Record each sample result in mL and specify US or Imperial units when reporting fl oz.',
];
const napkinCopy: Record<string,{name:string;summary:string;features:string[];removeDimensions?:boolean;removePacking?:boolean;note?:string}> = {
 GB36006JC:{name:'Clear Glass Napkin Holder for Restaurant Tables',summary:'Soda-lime glass napkin holder for upright tabletop presentation. Packed 12 pieces per carton for restaurant and hotel orders.',features:['Soda-lime glass construction.','Upright tabletop format.','12 pieces per carton.'],removeDimensions:true,note:'尺寸待核实：供应商概要 H125/B77 mm，规格表 H77/B125 mm。公开页已撤下冲突尺寸；请核实实物尺寸和内部开口。'},
 GB36004MH:{name:'Patterned Glass Napkin Holder with Arched Profile',summary:'Soda-lime glass napkin holder with a patterned arched profile. Packed 12 pieces per carton for tabletop service.',features:['Soda-lime glass construction.','Patterned arched profile.','12 pieces per carton.'],removeDimensions:true,note:'尺寸待核实：供应商概要与规格表的高度、底部尺寸互换。公开页已撤下冲突尺寸。'},
 GB36003YD:{name:'Low-Profile Glass Napkin Holder',summary:'Soda-lime glass napkin holder with a low profile. Listed top size 128 mm, height 42 mm and base size 92 mm; 12 pieces per carton.',features:['Soda-lime glass construction.','Listed top size 128 mm; height 42 mm; base size 92 mm.','12 pieces per carton.']},
 GB36008H:{name:'Open-Top Glass Napkin Holder with Fluted Sides',summary:'Soda-lime glass napkin holder with an open top and fluted sides. Packed 12 pieces per carton for restaurant and hotel tabletops.',features:['Soda-lime glass construction.','Open-top format with fluted sides.','12 pieces per carton.'],removeDimensions:true,note:'尺寸待核实：供应商概要 H125/B77 mm，规格表 H77/B125 mm。公开页已撤下冲突尺寸。'},
 GB36003TE:{name:'Swan-Pattern Glass Napkin Holder',summary:'Soda-lime glass napkin holder with a swan pattern. Listed top size 128 mm, height 42 mm and base size 92 mm.',features:['Soda-lime glass construction.','Swan-pattern design.','Listed top size 128 mm; height 42 mm; base size 92 mm.'],removePacking:true,note:'装箱数待核实：供应商概要12pcs/ctn，规格表18pcs/ctn。公开页已撤下冲突装箱数，不对外承诺12或18。'},
};
async function main(){
 const before=JSON.parse(await readFile(`${root}/before.json`,'utf8'));
 const articles=before.articles.filter((a:{slug:string})=>patchSlugs.some(slug=>slug===a.slug)||a.slug===articleSlugs.capacity).map((a: {slug:string;content:string;title:string;excerpt:string;coverImageAlt:string})=>{
  if(a.slug!==articleSlugs.capacity) return {slug:a.slug,data:{content:patchArticleLinks(a.slug,a.content).content}};
  const editor=JSON.parse(a.content);
  editor.blocks[0].data.text='Shot glass capacity describes a volume, but the fill endpoint determines the result. Brimful capacity is measured at the rim; intended fill volume is the amount poured for use. Keep both values separate from the nominal size in a product name.';
  assert(!editor.blocks.some((b:{id:string})=>b.id==='capacity-definitions-20261003'));
  editor.blocks.splice(1,0,
   {id:'capacity-definitions-20261003',type:'list',data:{style:'unordered',items:definitions}},
   {type:'paragraph',data:{text:'<b>mL and fl oz:</b> 1 US fl oz is approximately 29.57 mL; 1 Imperial fl oz is approximately 28.41 mL. State the unit system before comparing capacities.'}},
   {type:'header',data:{text:'How to measure shot glass capacity',level:2}},
   {type:'list',data:{style:'ordered',items:steps}});
  const captions=['Schematic of brimful capacity and intended fill volume in two generic shot glasses; no measured capacity is shown.','Illustration of a shot glass on a balance beside a record book; the blank display contains no measurement result.'];
  let image=0; for(const b of editor.blocks)if(b.type==='image')b.data.caption=captions[image++];
  assert.equal(image,2);
  return {slug:a.slug,data:{title:'Shot Glass Capacity: Brimful vs Fill Volume in mL & fl oz',excerpt:'Learn the difference between brimful capacity and fill volume, convert mL and fl oz, and measure shot glass samples with a repeatable water-weight method.',content:JSON.stringify(editor),coverImageAlt:'Illustration of two generic empty shot glasses beside measuring equipment.'}};
 });
 const products=before.products.filter((p:{sku:string})=>napkinCopy[p.sku]||p.sku==='GB631071700').map((p:{sku:string;slug:string;features:{id:string;value:string}[]})=>{
  const pitch=p.sku==='GB631071700';
  const copy=pitch?{name:'Borosilicate Glass Water Pitcher',summary:'Borosilicate glass water pitcher with a handle and pouring spout. Top diameter 110 mm, height 240 mm and bottom diameter 100 mm; packed 24 pieces per carton.',features:['Borosilicate glass construction.','Handle and pouring spout.','Top diameter 110 mm; height 240 mm; bottom diameter 100 mm.','24 pieces per carton.']}:napkinCopy[p.sku];
  const description=copy.features.join('\n');
  const note=pitch?'容量待核实：同一供应商原页概要为1700ml，规格表为540ml，均不能作为已核实容量。公开文案、图片alt及容量字段已撤下冲突值，保留SKU、原URL、图片、其他规格和商业字段。':copy.note;
  return {sku:p.sku,slug:p.slug,data:{name:copy.name,summary:copy.summary,description,seoTitle:copy.name,seoDescription:copy.summary,specificationHeading:'Specifications'},features:copy.features,removeLabels:pitch?['Capacity']:copy.removeDimensions?['Product size','Height','Bottom diameter']:copy.removePacking?['Package']:[],note};
 });
 await writeFile(`${root}/proposed.json`,JSON.stringify({articles,products},null,2));
 console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'dry-run',articles:articles.map((a:{slug:string})=>a.slug),products:products.map((p:{sku:string;removeLabels:string[]})=>({sku:p.sku,omit:p.removeLabels}))}));
 if(!process.argv.includes('--apply'))return;
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,statement_timeout:25000})});
 const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-'); const run=`${root}/${stamp}`;await mkdir(run,{recursive:true});await writeFile(`${run}/before.json`,JSON.stringify(before,null,2));
 try{
  await db.$transaction(async tx=>{
   for(const change of articles){const original=before.articles.find((a:{slug:string})=>a.slug===change.slug);const result=await tx.blogPost.updateMany({where:{id:original.id,updatedAt:new Date(original.updatedAt),content:original.content,status:'PUBLISHED'},data:change.data});assert.equal(result.count,1,`Article changed since snapshot: ${change.slug}`);}
   for(const change of products){
    const original=before.products.find((p:{sku:string})=>p.sku===change.sku);
    const next={...copySnapshot(original),...change.data,features:change.features};
    await recordCopyChange(tx,{productId:original.id,expectedUpdatedAt:original.updatedAt,next,adopted:['name','summary','description','features','seoTitle','seoDescription'],reason:`用户授权 SEO 优化：去除模板措辞和已确认的公开信息冲突。${change.note??'材质、尺寸和装箱资料交叉核对。'}`,adminId:'codex-user-authorized-seo-20261003',reviewed:false});
    await tx.product.update({where:{id:original.id},data:{...change.data,...(change.note?{copyNeedsReview:true}:{})}});
    // Retain existing feature IDs where possible, rather than replacing the relation.
    const existing=[...original.features].sort((a,b)=>a.sortOrder-b.sortOrder);
    for(let i=0;i<change.features.length;i++){if(existing[i])await tx.productFeature.update({where:{id:existing[i].id},data:{value:change.features[i]}});else await tx.productFeature.create({data:{productId:original.id,value:change.features[i],sortOrder:i}});}
    await tx.productFeature.deleteMany({where:{id:{in:existing.slice(change.features.length).map(f=>f.id)}}});
    for(const label of change.removeLabels){await tx.productOverviewField.deleteMany({where:{productId:original.id,label}});await tx.productSpecification.deleteMany({where:{productId:original.id,label,variantId:null,componentId:null}});await tx.productAttribute.deleteMany({where:{productId:original.id,label}});}
    await tx.productImage.updateMany({where:{productId:original.id},data:{alt:change.data.name}});
   }
  },{isolationLevel:'Serializable',timeout:120000,maxWait:10000});
  const readback={articles:await db.blogPost.findMany({where:{slug:{in:articles.map((a:{slug:string})=>a.slug)}}}),products:await db.product.findMany({where:{sku:{in:products.map((p:{sku:string})=>p.sku)}},include:{features:true,specifications:true,overviewFields:true,attributes:true,images:true,contentSections:true}})};
  for(const change of articles){const saved=readback.articles.find(a=>a.slug===change.slug)!;const original=before.articles.find((a:{slug:string})=>a.slug===change.slug);for(const [key,value]of Object.entries(change.data))assert.equal(saved[key as keyof typeof saved],value);for(const key of ['id','slug','status','publishedAt','featured','category','coverImage','createdAt','readTimeMinutes'])assert.equal(JSON.stringify(saved[key as keyof typeof saved]),JSON.stringify(original[key]));}
  for(const change of products){const saved=readback.products.find(p=>p.sku===change.sku)!;const original=before.products.find((p:{sku:string})=>p.sku===change.sku);for(const [key,value]of Object.entries(change.data))assert.equal(saved[key as keyof typeof saved],value);for(const key of ['id','slug','sku','status','publishedAt','featured','price','comparePrice','cost','currency','moq','stock','unit','sourceUrl','sourceProvider','legacyCategory','content'])assert.equal(JSON.stringify(saved[key as keyof typeof saved]),JSON.stringify(original[key]));for(const label of change.removeLabels)assert(!saved.overviewFields.some(f=>f.label===label)&&!saved.specifications.some(f=>f.label===label));assert.deepEqual([...saved.features].sort((a,b)=>a.sortOrder-b.sortOrder).map(f=>f.value),change.features);assert.deepEqual(saved.images.map(i=>i.url).sort(),original.images.map((i:{url:string})=>i.url).sort());}
  await writeFile(`${root}/readback.json`,JSON.stringify(readback,null,2));await writeFile(`${run}/readback.json`,JSON.stringify(readback,null,2));console.log('DATABASE_READBACK_VERIFIED',run);
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(String(e).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted]'));process.exitCode=1;});

