import {createRequire} from 'node:module';
import {homedir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
let busy=false;
export async function createPdf(html){
 if(typeof html!=='string'||!html.includes('class="page'))throw Object.assign(Error('レポートを作成してからPDF保存してください。'),{status:400});
 if(busy)throw Object.assign(Error('PDFを作成中です。しばらくお待ちください。'),{status:429});
 busy=true;let browser;
 try{
 let chromium;try{({chromium}=require('playwright-core'));}catch{if(process.env.VERCEL)throw Error('PDF実行環境が未設定です。');({chromium}=require(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
 if(process.env.VERCEL){const binary=require('@sparticuz/chromium');browser=await chromium.launch({headless:true,executablePath:await binary.executablePath(),args:binary.args});}
 else browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({javaScriptEnabled:false});
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='https:'&&['cyberjapandata.gsi.go.jp','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)&&['image','stylesheet','font'].includes(route.request().resourceType())?route.continue():route.abort();});
 const page=await context.newPage();await page.setContent(html,{waitUntil:'load',timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 return await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,timeout:60000});
 }finally{try{await browser?.close();}finally{busy=false;}}
}
