import test from 'node:test';
import assert from 'node:assert/strict';
import {localPlanning,candidates,percent} from '../lib/local-planning.mjs';
test('指定率の欠損をゼロと表示しない',()=>{for(const v of [null,'',-1,9999,'不明'])assert.equal(percent(v),'未収録');assert.equal(percent('60'),'60 %');});
test('境界付近は隣接区域も候補に残し、遠い地点は除外する',()=>{const f={bbox:[135,35,136,36],geometry:{type:'Polygon',coordinates:[[[135,35],[136,35],[136,36],[135,36],[135,35]]]}};assert.equal(candidates([f],{lat:35.5,lon:134.99998})[0].boundary,true);assert.equal(candidates([f],{lat:35.5,lon:134.99}).length,0);});
test('城陽市の指定率と原典年度を取得し、対象外を未取得とする',async()=>{const r=await localPlanning({lat:34.864101,lon:135.761292},'zoning');assert.equal(r.status,'ok');assert.ok(r.rows.some(x=>x.value==='60 %'));assert.ok(r.rows.some(x=>x.value.includes('2023年')));const outside=await localPlanning({lat:35.68,lon:139.76},'zoning');assert.equal(outside.status,'unavailable');});
test('宇治市の原典年度は公開年度と区別する',async()=>{const r=await localPlanning({lat:34.882423,lon:135.819565},'division');assert.equal(r.status,'ok');assert.ok(r.rows.some(x=>x.value==='2019年3月20日'));assert.ok(r.rows.some(x=>x.value==='2024年度版'));});
