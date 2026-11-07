const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
 const {buildReport}=await import('../public/report.mjs');
 const data=JSON.parse(await fs.readFile(__dirname+'/../test-output/public-data-live.json','utf8'));
 const html=buildReport(data,{companyName:'株式会社 INCEPTION',reportTitle:'エリア調査レポート',cover:'navy'});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{const page=await browser.newPage({viewport:{width:850,height:1200}});await page.setContent(html,{waitUntil:'networkidle'});
 const errors=await page.locator('.page').evaluateAll(pages=>pages.map((p,i)=>({page:i+1,height:p.offsetHeight,overlap:p.querySelector('.page-footer')&&p.querySelector('.page-footer').previousElementSibling.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top})).filter(x=>x.overlap||x.height>1123));
 for(const i of [2,3,5,6,8])await page.locator('.page').nth(i).screenshot({path:__dirname+`/../test-output/public-page-${i+1}.png`});
 await page.pdf({path:__dirname+'/../test-output/public-report.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
 const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).length);
 console.log(JSON.stringify({pages:await page.locator('.page').count(),errors,broken}));if(errors.length||broken)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
