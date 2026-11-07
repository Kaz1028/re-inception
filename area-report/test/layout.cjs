const {chromium}=require('playwright');
(async()=>{
 const {buildReport}=await import('../public/report.mjs');const {items}=await import('../public/catalog.mjs');
 const data={point:{lat:34.864101,lon:135.761292},label:'検証専用（架空データ）',radius:1000,generatedAt:new Date().toISOString(),selected:items.map(i=>i.id),results:{}};
 for(const i of items)data.results[i.id]={status:'unavailable',rows:[],message:'未取得テスト',source:'未取得'};
 data.results.transit={status:'ok',source:'検証用データ',scope:'レイアウト確認専用',rows:Array.from({length:29},(_,i)=>({name:'施設テスト '+i,distance:i*20,lat:34.864101+i*.0001,lon:135.761292})),message:'検証用'};
 data.results.households={status:'manual',source:'検証用資料',referenceDate:'2026年',text:'改ページの確認です。'.repeat(300)};
 const html=buildReport(data,{companyName:'テスト会社',reportTitle:'レイアウト検証',cover:'navy',useGreeting:true,greeting:'ご挨拶の確認です。'.repeat(140),companyDetails:'会社詳細の確認です。'.repeat(150)});
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:850,height:1200}});await page.setContent(html,{waitUntil:'networkidle'});
 const errors=await page.locator('.page').evaluateAll(pages=>pages.map((p,i)=>({page:i+1,height:p.offsetHeight,overlap:p.querySelector('.page-footer')&&p.querySelector('.page-footer').previousElementSibling.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top})).filter(x=>x.overlap||x.height>1123));
 await page.pdf({path:__dirname+'/../test-output/stress.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});console.log(JSON.stringify({pages:await page.locator('.page').count(),errors}));await browser.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
