import {readFile} from 'node:fs/promises';
import {contains} from './geo.mjs';
let dataset;
const sourceUrl='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A55-2024.html';
async function load(){if(!dataset)dataset=JSON.parse(await readFile(new URL('../data/planning-2024.json',import.meta.url),'utf8'));return dataset;}
export function percent(value){if(value==null||String(value).trim()==='')return '未収録';const n=Number(value);return Number.isFinite(n)&&n>0&&n<9999?n+' %':'未収録';}
export function boundaryDistance(geometry,point){const cos=Math.cos(point.lat*Math.PI/180),scale=111320;let min=Infinity;const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
 for(const rings of polygons)for(const ring of rings)for(let i=1;i<ring.length;i++){const a=[(ring[i-1][0]-point.lon)*cos*scale,(ring[i-1][1]-point.lat)*scale],b=[(ring[i][0]-point.lon)*cos*scale,(ring[i][1]-point.lat)*scale];const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/len)):0;min=Math.min(min,Math.hypot(a[0]+t*dx,a[1]+t*dy));}return min;
}
export function candidates(features,point){return features.filter(f=>{const [a,b,c,d]=f.bbox;return point.lon>=a-.0001&&point.lon<=c+.0001&&point.lat>=b-.0001&&point.lat<=d+.0001;}).map(f=>({...f,boundary:boundaryDistance(f.geometry,point)<=5,inside:contains(f.geometry,[point.lon,point.lat])})).filter(f=>f.inside||f.boundary);}
export async function localPlanning(point,id){const data=await load();const hits=candidates(data.layers[id],point);const base={source:'国土交通省 国土数値情報・都市計画決定情報 2024年度版（CC BY 4.0）を抽出・加工',sourceUrl,scope:'宇治市・城陽市の選択地点（敷地全体の判定ではありません）',fetchedAt:data.importedAt};
 if(!hits.length)return {...base,status:'unavailable',rows:[],message:'取り込んだ宇治市・城陽市の区域に、この地点の該当データを確認できません。対象地域外・データ欠落・用途未指定等の区別はしていません。自治体に確認してください。'};
 const boundary=hits.some(f=>f.boundary),rows=[];
 for(const [i,f] of hits.entries()){const p=f.properties,meta=data.cities[p.Citycode],prefix=hits.length>1?`候補${i+1}：`:'';
 rows.push({name:prefix+'自治体',value:p.Cityname});
 if(id==='zoning')rows.push({name:prefix+'用途地域',value:p.YoutoName||'未収録'},{name:prefix+'指定建ぺい率',value:percent(p.BCR)},{name:prefix+'指定容積率',value:percent(p.FAR)});
 else rows.push({name:prefix+'区域区分',value:p.AreaType||'未収録'});
 rows.push({name:prefix+'原典データ時点',value:meta.referenceDate},{name:prefix+'データ公開版',value:'2024年度版',note:'公開版の年度と原典の時点は異なります。'});
 }
 return {...base,status:'ok',rows,geometries:hits.map(f=>f.geometry),message:(boundary||hits.length>1?'区域境界から約5m以内、または複数区域が重なっています。表示は候補です。自治体の詳細図で確認してください。 ':'')+'公開ファイルの過去時点の参考情報です。最新の指定は自治体に確認してください。境界は概略で誤差を含みます。表示の指定率は道路幅員や緩和等を考慮した、その敷地で適用される最終的な上限ではありません。'};
}
