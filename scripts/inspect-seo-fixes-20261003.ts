import { config } from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as cheerio from 'cheerio';
config({path:'.env',quiet:true}); config({path:'.env.local',quiet:true,override:true});
const out='output/seo-fixes-20261003';
async function main(){
await mkdir(out,{recursive:true});
const client=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,statement_timeout:20000})});
const slugs=['shot-glass-buying-guide-for-wholesale-buyers','shot-glass-capacity-check-ml-fl-oz-fill-levels','custom-logo-shot-glasses-artwork-sample-approval-checklist','shot-glass-packaging-bulk-dividers-gift-boxes-carton-checks','shot-glass-moq-wholesale-quote-comparison','coffee-tea-glassware-buying-guide'];
try {
 const products=await client.product.findMany({where:{OR:[{categories:{some:{category:{slug:'glass-napkin-holders'}}}},{name:{contains:'1.7L',mode:'insensitive'}}]},include:{specifications:true,attributes:true,overviewFields:true,features:true,contentSections:true,images:true}});
 const articles=await client.blogPost.findMany({where:{slug:{in:slugs}}});
 const live=await fetch('https://www.glarivoglass.com/sitemap.xml',{signal:AbortSignal.timeout(30000)}).then(r=>r.text());
 await writeFile(`${out}/sitemap.xml`,live);
 const old=await readFile('output/restaurant-rack-20260928/sitemap.xml','utf8');
 const locs=(s:string)=>[...s.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 const current=new Set(locs(live)); const removed=locs(old).filter(u=>u.includes('/products/')&&!u.includes('/category/')&&!current.has(u));
 const retired=await client.product.findMany({where:{slug:{in:removed.map(u=>u.split('/').pop()!)}},select:{id: true,slug:true,sku:true,name:true,status:true,publishedAt:true,updatedAt:true,sourceUrl:true}});
 await writeFile(`${out}/before.json`,JSON.stringify({products,articles,removed,retired},null,2));
 console.log(JSON.stringify({products:products.map(p=>({slug:p.slug,sku:p.sku,sourceUrl:p.sourceUrl,name:p.name,specifications:p.specifications.map(s=>({id:s.id,label:s.label,value:s.value})),overview:p.overviewFields.map(s=>({id:s.id,label:s.label,value:s.value}))})),articles:articles.map(a=>({slug:a.slug,title:a.title,status:a.status,blocks:JSON.parse(a.content).blocks?.length})),retired,removedCount:removed.length},null,2));
 for(const slug of slugs){const r=await fetch(`https://www.glarivoglass.com/blog/${slug}`,{signal:AbortSignal.timeout(30000)});const html=await r.text(); await writeFile(`${out}/${slug}.before.html`,html);const $=cheerio.load(html); console.log(JSON.stringify({slug,status:r.status,title:$('title').text(),h1:$('h1').text()}));}
}catch(e){console.error('INSPECTION_FAILED',String(e).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted]'));process.exitCode=1;}finally{await client.$disconnect();}
}
main();
