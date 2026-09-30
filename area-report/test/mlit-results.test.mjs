import test from 'node:test';
import assert from 'node:assert/strict';
import {populationRows,noAreaMessage} from '../lib/mlit-results.mjs';
test('人口構成は2020年固定にせず、揃う年の推計を表示',()=>{const rows=populationRows([{properties:{MESH_ID:'123',PTN_2020:99,PT00_2025:100,PTA_2025:10,PTB_2025:60,PTC_2025:30}}]);assert.equal(rows.length,4);assert.match(rows[0].name,/2025年.*推計/);assert.equal(rows[1].value,'10 人');});
test('欠損や秘匿の負値を人口ゼロとして扱わない',()=>{for(const value of [null,'',-9999])assert.deepEqual(populationRows([{properties:{PT00_2025:100,PTA_2025:value,PTB_2025:60,PTC_2025:30}}]),[]);});
test('区域に一致しない結果は通信失敗や安全判定と区別',()=>{assert.match(noAreaMessage(1),/通信は成功/);assert.match(noAreaMessage(1),/区域データは1件/);assert.match(noAreaMessage(0),/未整備・未収録/);});
