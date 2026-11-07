const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),requests=[],errors=[];
 page.on('request',r=>requests.push({url:r.url(),body:r.postData()||''}));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/report',async route=>{const {point,radius,selected}=route.request().postDataJSON();await route.fulfill({json:{point,radius,selected,generatedAt:new Date().toISOString(),results:Object.fromEntries(selected.map(id=>[id,{id,status:'ok',rows:[{name:'テスト結果',value:'確認済み'}],source:'テスト資料',scope:'選択地点',fetchedAt:new Date().toISOString()}]))}});});
 await page.goto('http://127.0.0.1:4318/');
 // Select the map and set private report fields without sending them to search.
 await page.locator('#map').click({position:{x:130,y:170}});
 await page.locator('#locationName').fill('PRIVATE_ADDRESS_TEST');
 await page.locator('#configureButton').click();
 await page.locator('[data-item]:checked').evaluateAll(nodes=>nodes.forEach(n=>n.click()));
 await page.locator('[data-item="elevation"]').check();
 await page.locator('[data-tab="cover"]').click();await page.locator('#customer').fill('PRIVATE_CUSTOMER_TEST お客様');
 await page.locator('[data-tab="notes"]').click();await page.locator('#noteItem').selectOption('elevation');await page.locator('#noteSource').fill('PRIVATE_SOURCE_TEST');await page.locator('#noteDate').fill('2026-09-26');await page.locator('#noteText').fill('PRIVATE_NOTE_TEST 調査メモ');await page.locator('#saveNote').click();
 await page.locator('[data-close="settingsDialog"]').last().click();await page.locator('#generateButton').click();await page.waitForSelector('#reportDialog[open]');
 for(const [id,ext] of [['excelButton','xlsx'],['pdfButton','pdf']]){const event=page.waitForEvent('download',{timeout:180000});await page.locator('#'+id).click();const file=await event;await file.saveAs(__dirname+'/../test-output/private-client.'+ext);}
 const leaks=requests.filter(r=>/PRIVATE_|api\/(pdf|excel)/.test(r.url+r.body));if(leaks.length)throw Error('Private export data sent over network: '+JSON.stringify(leaks));
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:__dirname+'/../test-output/client-export-mobile.png'});
 for(const endpoint of ['pdf','excel']){const r=await page.request.post('http://127.0.0.1:4318/api/'+endpoint,{data:{}});if(r.status()!==405)throw Error('Old endpoint still accepts exports');}
 console.log(JSON.stringify({mobile:'390x844',exports:['PDF','XLSX'],privateDataLeaks:leaks.length,pageErrors:errors,requestBodies:requests.filter(r=>r.body).map(r=>r.body)}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
