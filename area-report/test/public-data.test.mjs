import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEarthquake,parseStatistics,mapTiles,hazardMaps} from '../lib/public-data.mjs';
import {buildReport} from '../public/report.mjs';
test('地震確率は割合を百分率に変換し、欠損を0にしない',()=>{
 const props={T30_I45_PS:'0.95',T30_I50_PS:'0.8',T30_I55_PS:'0.5',T30_I60_PS:'0.1'};
 const data={status:'Success',features:[{properties:props}]};assert.equal(parseEarthquake(data)[0].value,'95.00 %');props.T30_I55_PS=null;assert.throws(()=>parseEarthquake(data));
});
test('統計は対象の市だけを取り、速報と単位を保持する',()=>{
 const data={GET_STATS:{RESULT:{status:'0'},STATISTICAL_DATA:{TABLE_INF:{STAT_NAME:[{$:'国勢調査'}]},CLASS_INF:{CLASS_OBJ:[{'@id':'regionCode',CLASS:[{'@code':'26207','@name':'城陽市'}]},{'@id':'time',CLASS:[{'@code':'2025CY00','@name':'2025年'}]},{'@id':'unit',CLASS:[{'@code':'090',$:'人'}]},{'@id':'isProvisional',CLASS:[{'@code':'1',$:'速報'}]}]},DATA_INF:{DATA_OBJ:[{VALUE:{'@regionCode':'26207','@regionRank':'4','@time':'2025CY00','@unit':'090','@isProvisional':'1',$:'71769'}},{VALUE:{'@regionCode':'26204','@regionRank':'4','@time':'2025CY00',$:'999999'}}]}}}};
 const parsed=parseStatistics(data,'26207');assert.equal(parsed.rows.length,1);assert.equal(parsed.rows[0].value,'71,769 人');assert.equal(parsed.rows[0].note,'速報');
});
test('地図画像404を安全・該当なしと扱わず、未取得の地図ページにも注意を表示する',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:404});
 try{const point={lat:35,lon:135};const r=await hazardMaps(point,1000,'floodMap');assert.equal(r.status,'unavailable');assert.ok(r.maps[0].missing>0);assert.equal(r.maps[0].failed,0);
 const html=buildReport({point,radius:1000,label:'検証',selected:['floodMap'],results:{floodMap:r},generatedAt:new Date().toISOString()},{companyName:'検証'});assert.match(html,/未着色・画像未配信は安全を意味しません/);assert.match(html,/凡例を取得できません/);
 }finally{globalThis.fetch=original;}
});
test('地図タイルはレポートの縮尺で計算する',()=>{for(const [radius,z] of [[500,15],[1000,14],[2000,13]])assert.ok(mapTiles({lat:34.86,lon:135.76},radius).every(t=>t.z===z&&Number.isFinite(t.left)));});
