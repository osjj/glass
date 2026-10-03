import { readFile,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
const root='output/seo-fixes-20261003';
async function main(){
 const saved=JSON.parse(await readFile(`${root}/readback.json`,'utf8'));
 const before=JSON.parse(await readFile(`${root}/before.json`,'utf8'));
 const report:unknown[]=[];
 const targets=[...saved.articles.map((a:{slug:string;title:string})=>({path:`/blog/${a.slug}`,title:a.title,kind:'article'})),...saved.products.map((p:{slug:string;name:string})=>({path:`/products/${p.slug}`,title:p.name,kind:'product'}))];
 for(const target of targets){
  const url=`https://www.glarivoglass.com${target.path}`;const res=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});const html=await res.text();const $=cheerio.load(html);const main=$('main').text();
  assert.equal(res.status,200,url);assert.equal($('h1').text().trim(),target.title,url);assert.equal($('link[rel="canonical"]').attr('href'),url,url);
  const broken=$('a[href]').toArray().map(e=>$(e).attr('href')!).filter(h=>/[<>]|&lt;|&gt;/.test(h));assert.deepEqual(broken,[],url);
  if(target.path.includes('1-7l-big-capacity-pyrex'))assert(!/540\s*ml|1\.7\s*L|1700\s*ml/i.test(main));
  if(target.path.includes('capacity-check')){assert(main.includes('How to measure shot glass capacity'));assert(main.includes('Nominal size:'));assert(!/AI-generated/.test(main));}
  if(target.path.includes('buying-guide-for-wholesale'))for(const slug of ['shot-glass-capacity-check-ml-fl-oz-fill-levels','custom-logo-shot-glasses-artwork-sample-approval-checklist','shot-glass-packaging-bulk-dividers-gift-boxes-carton-checks','shot-glass-moq-wholesale-quote-comparison'])assert($(`a[href$="/blog/${slug}"]`).length>0,slug);
  const stale=$('main a[href]').toArray().map(e=>$(e).attr('href')!).filter(h=>before.removed.includes(h)||before.removed.includes(`https://www.glarivoglass.com${h}`));
  await writeFile(`${root}/${target.path.split('/').pop()}.after.html`,html);
  report.push({url,status:res.status,h1:$('h1').text(),title:$('title').text(),canonical:$('link[rel="canonical"]').attr('href'),brokenReferences:broken,retiredLinks:stale});
  await writeFile(`${root}/public-pages-verification.json`,JSON.stringify(report,null,2));
 }
 const inspect=async(url:string)=>{try{const res=await fetch(url,{signal:AbortSignal.timeout(12000)});const result={url,status:res.status,finalUrl:res.url,contentType:res.headers.get('content-type')};await res.body?.cancel();return result;}catch(e){return {url,readUnavailable:String(e)};}};
 const retired=[];for(let i=0;i<before.removed.length;i+=4)retired.push(...await Promise.all(before.removed.slice(i,i+4).map(inspect)));
 const references=await Promise.all(['https://www.ista.org/getting_started_with_design.php','https://global.hario.com/faq/glass_1_en.pdf'].map(inspect));
 const sitemap=await fetch('https://www.glarivoglass.com/sitemap.xml',{signal:AbortSignal.timeout(30000)}).then(r=>r.text());
 for(const target of targets)assert(sitemap.includes(`https://www.glarivoglass.com${target.path}`));
 await writeFile(`${root}/public-verification.json`,JSON.stringify({checkedAt:new Date().toISOString(),pages:report,retired,references,sitemapCount:[...sitemap.matchAll(/<loc>/g)].length},null,2));console.log(JSON.stringify({pagesVerified:report.length,retiredStatus:retired.map(r=>r.status),references,pages:report},null,2));
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
