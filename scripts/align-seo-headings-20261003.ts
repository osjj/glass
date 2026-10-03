import { config } from 'dotenv';
import { readFile,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
config({path:'.env',quiet:true});config({path:'.env.local',quiet:true,override:true});
async function main(){
 const root='output/seo-fixes-20261003';const prior=JSON.parse(await readFile(`${root}/readback.json`,'utf8'));
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,statement_timeout:20000})});
 try{const current=await db.product.findMany({where:{id:{in:prior.products.map((p:{id:string})=>p.id)}},include:{images:true}});await writeFile(`${root}/heading-alignment.before.json`,JSON.stringify(current,null,2));
  await db.$transaction(async tx=>{for(const p of current){const result=await tx.product.updateMany({where:{id:p.id,updatedAt:p.updatedAt},data:{specificationHeading:'Specifications'}});assert.equal(result.count,1);await tx.productImage.updateMany({where:{productId:p.id},data:{alt:p.name}});}},{timeout:60000});
  const products=await db.product.findMany({where:{id:{in:current.map(p=>p.id)}},include:{features:true,specifications:true,overviewFields:true,attributes:true,images:true,contentSections:true}});
  for(const p of products){assert.equal(p.specificationHeading,'Specifications');assert(p.images.every(i=>i.alt===p.name));}
  await writeFile(`${root}/readback.json`,JSON.stringify({...prior,products},null,2));console.log('HEADINGS_AND_ALTS_VERIFIED');
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(String(e).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted]'));process.exitCode=1;});
