import test from 'node:test';
import assert from 'node:assert/strict';
import {distance,contains,validPoint} from '../lib/geo.mjs';
import {buildReport,excelRows} from '../public/report.mjs';
import {workbook} from '../lib/xlsx.mjs';
test('区域判定はポリゴンの穴を対象外とする',()=>{const geometry={type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]};assert.equal(contains(geometry,[2,2]),true);assert.equal(contains(geometry,[5,5]),false);assert.equal(contains(geometry,[11,5]),false);});
test('直線距離・日本の座標範囲',()=>{assert.equal(distance({lat:35,lon:135},{lat:35,lon:135}),0);assert.ok(Math.abs(distance({lat:0,lon:0},{lat:1,lon:0})-111195)<2);assert.equal(validPoint({lat:34.86,lon:135.76}),true);assert.equal(validPoint({lat:NaN,lon:135}),false);});
test('未取得は安全判定にせず、入力文字はHTMLとして実行しない',()=>{const report={point:{lat:34.86,lon:135.76},radius:1000,label:'<script>bad()</script>',selected:['flood'],generatedAt:'2026-09-19T00:00:00Z',results:{flood:{status:'unavailable',rows:[],message:'未設定',source:'未取得'}}};const html=buildReport(report,{cover:'navy',companyName:'<img onerror=bad()>',reportTitle:'テスト'});assert.ok(html.includes('データ未取得'));assert.ok(html.includes('安全性は判定していません'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));assert.ok(excelRows(report,{companyName:'会社'}).some(row=>row.includes('未取得')));});
test('XLSXはZIP形式で出力し、入力を式として解釈しない',()=>{const data=workbook([['=1+1','日本語','<tag>']]);assert.equal(data.readUInt32LE(0),0x04034b50);assert.ok(data.toString().includes('t="inlineStr"'));assert.ok(!data.toString().includes('<f>'));});
