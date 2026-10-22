const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4318/');await page.locator('#address').fill('城陽市役所');await page.locator('#searchButton').click();await page.locator('#searchResults button').first().click();
 await page.locator('#configureButton').click();await page.locator('#publicPreset').click();if(await page.locator('[data-item]:checked').count()!==12)throw Error('preset count');
 for(const id of ['shops','medical','schools','public','elevation','shaking','floodMap','landslideMap','municipalPopulation','municipalHouseholds'])await page.locator('[data-item="'+id+'"]').uncheck();
 await page.locator('[data-close="settingsDialog"]').last().click();const pending=page.waitForResponse(r=>r.url().endsWith('/api/report'));await page.locator('#generateButton').click();const data=await(await pending).json();
 for(const id of ['zoning','division'])if(data.results[id].status!=='ok')throw Error(JSON.stringify(data.results[id]));
 await page.waitForSelector('#reportDialog[open]');const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('.page');
 const pdfDownload=page.waitForEvent('download',{timeout:90000});await page.locator('#pdfButton').click();const pdfFile=await pdfDownload;await pdfFile.saveAs(__dirname+'/../test-output/button-download.pdf');const bytes=await fs.readFile(__dirname+'/../test-output/button-download.pdf');if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid PDF');
 const {buildReport}=await import('../public/report.mjs');const preview=await browser.newPage({viewport:{width:850,height:1200}});await preview.setContent(buildReport(data,{companyName:'株式会社 INCEPTION'}),{waitUntil:'networkidle'});
 const overflow=await preview.locator('.page').evaluateAll(pages=>pages.filter(p=>p.offsetHeight>1123||(p.querySelector('.page-footer')&&p.querySelector('.page-footer').previousElementSibling.getBoundingClientRect().bottom>p.querySelector('.page-footer').getBoundingClientRect().top)).length);
 await preview.locator('.page').nth(1).screenshot({path:__dirname+'/../test-output/planning-page.png'});await preview.pdf({path:__dirname+'/../test-output/planning-report.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
 await fs.writeFile(__dirname+'/../test-output/planning-live.json',JSON.stringify(data));console.log(JSON.stringify({point:data.point,rows:data.results.zoning.rows,pages:await preview.locator('.page').count(),overflow,errors}));if(overflow||errors.length)process.exitCode=1;
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
