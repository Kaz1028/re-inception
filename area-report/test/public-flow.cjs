const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4318/');await page.locator('#address').fill('宇治市宇治');await page.locator('#searchButton').click();await page.locator('#searchResults button').first().click();
 await page.locator('#configureButton').click();await page.locator('#publicPreset').click();const checked=await page.locator('[data-item]:checked').count();if(checked!==12)throw Error('基本セットの選択数が不正');
 for(const id of ['shops','medical','schools','public'])await page.locator(`[data-item="${id}"]`).uncheck();
 await page.screenshot({path:__dirname+'/../test-output/public-settings.png'});
 await page.locator('[data-close="settingsDialog"]').last().click();const response=page.waitForResponse(r=>r.url().endsWith('/api/report'),{timeout:180000});await page.locator('#generateButton').click();const data=await(await response).json();
 await page.waitForSelector('#reportDialog[open]');const frame=page.frames().find(f=>f.parentFrame());await frame.waitForSelector('.page');
 const dl=page.waitForEvent('download');await page.locator('#excelButton').click();await(await dl).saveAs(__dirname+'/../test-output/public-uji.xlsx');
 await page.locator('[data-close="reportDialog"]').click();await page.setViewportSize({width:390,height:844});await page.locator('#configureButton').click();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);await page.screenshot({path:__dirname+'/../test-output/public-mobile.png'});
 console.log(JSON.stringify({errors,overflow,preset:checked,point:data.point,results:Object.fromEntries(Object.entries(data.results).map(([k,r])=>[k,{status:r.status,scope:r.scope}]))}));if(errors.length||overflow)process.exitCode=1;
 await fs.writeFile(__dirname+'/../test-output/public-uji.json',JSON.stringify(data));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
