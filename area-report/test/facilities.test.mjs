process.env.FACILITY_STORE_DISABLED='1';
import test from 'node:test';
import assert from 'node:assert/strict';
import {collect} from '../lib/data.mjs';

test('504を再試行し、失敗項目を他の施設へ波及させず、成功項目だけキャッシュする',async()=>{
 const original=globalThis.fetch;const counts={shops:0,medical:0,public:0};let active=0,maxActive=0;
 globalThis.fetch=async(url,options)=>{
  const q=options.body.get('data');const id=q.includes('[shop')?'shops':q.includes('hospital')?'medical':'public';
  counts[id]++;active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,10));active--;
  if(id==='medical'||(id==='shops'&&counts[id]===1))return new Response('',{status:504});
  return Response.json({elements:[{type:'node',id:1,lat:34.8641,lon:135.7612,tags:id==='shops'?{shop:'supermarket',name:'検証施設'}:{amenity:'library',name:'検証図書館'}}]});
 };
 try{
  const input={point:{lat:34.8641,lon:135.7612},radius:1000,selected:['shops','medical','public']};
  const first=await collect(input);
  assert.equal(first.results.shops.status,'ok');assert.equal(first.results.public.status,'ok');assert.equal(first.results.medical.status,'error');
  assert.match(first.results.medical.message,/自動再試行/);assert.deepEqual(counts,{shops:2,medical:2,public:1});assert.ok(maxActive<=2);
  const second=await collect({...input,selected:['shops','public']});
  assert.deepEqual(counts,{shops:2,medical:2,public:1});assert.equal(second.results.shops.fetchedAt,first.results.shops.fetchedAt);
 }finally{globalThis.fetch=original;}
});
