import { config } from 'dotenv';
import { readFile,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
config({path:'.env',quiet:true});config({path:'.env.local',quiet:true,override:true});
async function main(){
 const root='output/seo-fixes-20261003';const prior=JSON.parse(await readFile(`${root}/readback.json`,'utf8'));
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,statement_timeout:20000})});
 try{
  const current=await db.blogPost.findMany({where:{id:{in:prior.articles.map((a:{id:string})=>a.id)}}});await writeFile(`${root}/article-cleanup.before.json`,JSON.stringify(current,null,2));
  const changes=current.map(a=>{
   const content=JSON.parse(a.content);
   for(const block of content.blocks){
    if(block.type==='list')block.data.items=block.data.items.filter((item:unknown)=>!JSON.stringify(item).includes('/products/wholesale-1-7oz-transparent-shot-glass'));
    if(block.type==='paragraph'&&String(block.data.text).startsWith('Three Glarivo catalog references'))block.data.text='These Glarivo catalog examples show how glass shape affects the packing brief. Record the inner layout, unit protection and carton dimensions for each selected model.';
    if(block.type==='paragraph'&&String(block.data.text).startsWith('The two listings showing 144 pieces'))block.data.text='A per-box count does not define the shipping carton. Record the number of glasses per inner pack, the number of inner packs per carton and the resulting carton quantity separately.';
   }
   return {original:a,content:JSON.stringify(content).replaceAll('AI-generated ','').replaceAll('AI generated ',''),coverImageAlt:(a.coverImageAlt??'').replaceAll('AI-generated ','').replaceAll('AI generated ','')};
  }).filter(c=>c.content!==c.original.content||c.coverImageAlt!==c.original.coverImageAlt);
  await db.$transaction(async tx=>{for(const c of changes){const r=await tx.blogPost.updateMany({where:{id:c.original.id,updatedAt:c.original.updatedAt,content:c.original.content},data:{content:c.content,coverImageAlt:c.coverImageAlt}});assert.equal(r.count,1);}},{timeout:60000});
  const articles=await db.blogPost.findMany({where:{id:{in:current.map(a=>a.id)}}});for(const a of articles){assert(!a.content.includes('/products/wholesale-1-7oz-transparent-shot-glass'));assert(!a.content.includes('AI-generated'));}
  await writeFile(`${root}/readback.json`,JSON.stringify({...prior,articles},null,2));
  const a=articles.find(a=>a.slug==='shot-glass-capacity-check-ml-fl-oz-fill-levels')!;
  const draftPath=`content/drafts/${a.slug}.draft.json`;const draft=JSON.parse(await readFile(draftPath,'utf8'));Object.assign(draft,{title:a.title,excerpt:a.excerpt,content:a.content,coverImageAlt:a.coverImageAlt});await writeFile(draftPath,JSON.stringify(draft,null,2)+'\n');
  const path=`content/drafts/${a.slug}.md`;let md=await readFile(path,'utf8');md=md.replace('# Shot Glass Capacity: How to Check mL, fl oz & Fill Levels',`# ${a.title}`);
  const blocks=JSON.parse(a.content).blocks;const plain=(s:string)=>s.replaceAll('<b>','**').replaceAll('</b>','**');
  const intro=[plain(blocks[0].data.text),blocks[1].data.items.map((s:string)=>`- ${plain(s)}`).join('\n'),plain(blocks[2].data.text),`## ${blocks[3].data.text}`,blocks[4].data.items.map((s:string,i:number)=>`${i+1}. ${s}`).join('\n')].join('\n\n');
  md=md.replace(/A shot glass described[\s\S]*?(?=\n\nThis checklist)/,intro);md=md.replaceAll('AI-generated ','');await writeFile(path,md);
  console.log('ARTICLE_CLEANUP_VERIFIED',changes.map(c=>c.original.slug));
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(String(e).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted]'));process.exitCode=1;});
