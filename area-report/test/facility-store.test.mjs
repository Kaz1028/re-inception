import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('施設を保存し、通信失敗でも前回成功分と取得日を維持する',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'inception-facilities-'));process.env.FACILITY_CACHE_DIR=dir;
 const {refresh,saved,regionalFacilities,covers}=await import('../lib/facility-store.mjs');const original=globalThis.fetch;
 try{globalThis.fetch=async()=>Response.json({elements:[{id:1,type:'node',lat:34.86,lon:135.77,tags:{shop:'supermarket'}}]});
 const first=await refresh('shops',['[shop=supermarket]']);assert.equal((await saved('shops')).elements.length,1);
 first.fetchedAt='2020-01-01T00:00:00.000Z';await writeFile(join(dir,'shops.json'),JSON.stringify(first));globalThis.fetch=async()=>new Response('',{status:504});
 await assert.rejects(refresh('shops',['[shop=supermarket]']));const fallback=await regionalFacilities({lat:34.86,lon:135.77},1000,'shops',['[shop=supermarket]']);assert.equal(fallback.fetchedAt,first.fetchedAt);assert.match(fallback.storageNote,/更新は未完了/);assert.equal(JSON.parse(await readFile(join(dir,'shops.json'))).elements.length,1);
 assert.equal(covers({lat:35,lon:139},1000),false);assert.equal(covers({lat:34.7801,lon:135.77},2000),false);
 }finally{globalThis.fetch=original;delete process.env.FACILITY_CACHE_DIR;}
});
