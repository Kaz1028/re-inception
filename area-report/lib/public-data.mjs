const memo=new Map();
async function remember(key,fn){let p=memo.get(key);if(p&&p.expires>Date.now())return p.value;if(memo.size>=500)memo.delete(memo.keys().next().value);const value=fn();memo.set(key,{value,expires:Date.now()+3600000});try{return await value;}catch(e){memo.delete(key);throw e;}}
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('公開データ提供元の応答: HTTP '+r.status);return r.json();}
const array=x=>Array.isArray(x)?x:x==null?[]:[x];
export function parseEarthquake(data){
 if(data.status!=='Success'||!data.features?.length)throw Error('この地点の地震情報を取得できません。');
 const p=data.features[0].properties;
 return [['T30_I45_PS','30年間で震度5弱以上'],['T30_I50_PS','30年間で震度5強以上'],['T30_I55_PS','30年間で震度6弱以上'],['T30_I60_PS','30年間で震度6強以上']].map(([key,name])=>{const raw=p[key];const n=Number(raw);if(raw==null||raw===''||!Number.isFinite(n)||n<0||n>1)throw Error('地震確率の値を確認できません。');return {name,value:(n*100).toFixed(2)+' %'};});
}
export async function earthquake(point){return remember('quake:'+JSON.stringify(point),async()=>{
 const data=await read('https://www.j-shis.bosai.go.jp/map/api/pshm/Y2024/AVR/TTL_MTTL/meshinfo.geojson?'+new URLSearchParams({position:point.lon+','+point.lat,epsg:'4326'}));
 return {status:'ok',rows:parseEarthquake(data),source:'防災科学技術研究所 J-SHIS・2024年（NIED作成版）・平均ケース・全地震',sourceUrl:'https://www.j-shis.bosai.go.jp/api-pshm-meshinfo',scope:'地点を含む250mメッシュ '+data.metaData.meshcode,message:'2024年版モデルの30年間の超過確率です。作成日からの30年間を再計算した値ではありません。建物の耐震性や個別敷地の安全性を判定するものではありません。',fetchedAt:new Date().toISOString()};
 });}
export function parseStatistics(data,code){
 const root=data.GET_STATS;if(root?.RESULT?.status!=='0')throw Error('この市区町村の統計データを取得できません。');
 const stats=root.STATISTICAL_DATA,classes=array(stats.CLASS_INF.CLASS_OBJ);
 const entries=id=>array(classes.find(c=>c['@id']===id)?.CLASS);
 const lookup=(id,c)=>entries(id).find(x=>x['@code']===c);
 const name=lookup('regionCode',code)?.['@name'];if(!name)throw Error('統計の地域名を確認できません。');
 const values=array(stats.DATA_INF.DATA_OBJ).flatMap(o=>array(o.VALUE)).filter(v=>v['@regionCode']===code&&v['@regionRank']==='4'&&/^\d{4}CY00$/.test(v['@time'])&&v.$!==''&&v.$!=null&&Number.isFinite(Number(v.$)));
 const rows=values.sort((a,b)=>a['@time'].localeCompare(b['@time'])).slice(-6).map(v=>({name:lookup('time',v['@time'])?.['@name']||v['@time'],value:Number(v.$).toLocaleString('ja-JP')+' '+(lookup('unit',v['@unit'])?.$||''),note:lookup('isProvisional',v['@isProvisional'])?.$||'速報・確報区分未収録'}));
 if(!rows.length)throw Error('利用可能な統計値がありません。');return {name,rows,stat:array(stats.TABLE_INF.STAT_NAME).map(x=>x.$).join('・')};
}
export async function municipality(point,kind){
 const geo=await remember('reverse:'+JSON.stringify(point),()=>read('https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?'+new URLSearchParams({lat:point.lat,lon:point.lon})));
 const code=geo.results?.muniCd;if(!/^\d{5}$/.test(code))throw Error('この地点の市区町村を特定できません。');
 return remember('stats:'+code+':'+kind,async()=>{const indicator=kind==='municipalPopulation'?'0201010000000010000':'0202010000000010010';const data=await read('https://dashboard.e-stat.go.jp/api/1.0/Json/getData?'+new URLSearchParams({Lang:'JP',IndicatorCode:indicator,RegionCode:code,Cycle:'3',RegionalRank:'4',IsSeasonalAdjustment:'1',MetaGetFlg:'Y',SectionHeaderFlg:'1'}));const parsed=parseStatistics(data,code);
 return {status:'ok',rows:parsed.rows,source:'総務省 統計ダッシュボード／'+parsed.stat,sourceUrl:'https://dashboard.e-stat.go.jp/static/api',scope:parsed.name+'全体（市区町村コード '+code+'）',message:'市区町村全体の統計です。指定半径内の人口・世帯数ではありません。年次と速報・確報の区分を確認してください。このサービスは、統計ダッシュボードのAPI機能を使用していますが、サービスの内容は国によって保証されたものではありません。',fetchedAt:new Date().toISOString()};});
}
const layers={
 floodMap:[['洪水浸水想定区域（想定最大規模）','01_flood_l2_shinsuishin_data','shinsui_legend3.png']],
 landslideMap:[['土砂災害警戒区域（土石流）','05_dosekiryukeikaikuiki','keikai_dosekiryu.png'],['土砂災害警戒区域（急傾斜地の崩壊）','05_kyukeishakeikaikuiki','keikai_kyukeisya.png'],['土砂災害警戒区域（地すべり）','05_jisuberikeikaikuiki','keikai_jisuberi.png']]
};
// Use the same tile grid and zoom as the report renderer. Only fixed official hosts are fetched.
export function mapTiles(point,radius){const z=radius<=500?15:radius<=1000?14:13,n=2**z*256;const x=(point.lon+180)/360*n,y=(1-Math.asinh(Math.tan(point.lat*Math.PI/180))/Math.PI)/2*n;const left=x-340,top=y-165;const tiles=[];for(let tx=Math.floor(left/256);tx<=Math.floor((left+680)/256);tx++)for(let ty=Math.floor(top/256);ty<=Math.floor((top+330)/256);ty++)tiles.push({z,x:tx,y:ty,left:tx*256-left,top:ty*256-top});return tiles;}
async function png(url){return remember(url,async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(r.status===404)return null;if(!r.ok)throw Error('地図配信エラー HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length>2000000||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('地図画像の形式を確認できません。');return 'data:image/png;base64,'+b.toString('base64');});}
export async function hazardMaps(point,radius,kind){const maps=[];
 for(const [title,layer,legend] of layers[kind]){const tiles=mapTiles(point,radius),queue=[...tiles],images=[];let missing=0,failed=0;
  await Promise.all(Array.from({length:3},async()=>{while(queue.length){const t=queue.shift();try{const image=await png(`https://disaportaldata.gsi.go.jp/raster/${layer}/${t.z}/${t.x}/${t.y}.png`);if(image)images.push({...t,image});else missing++;}catch{failed++;}}}));
  let legendImage=null;try{legendImage=await png('https://disaportal.gsi.go.jp/hazardmap/copyright/img/'+legend);}catch{}
  maps.push({title,images,legendImage,missing,failed,total:tiles.length,status:failed||!images.length||!legendImage?'unavailable':'ok'});
 }
 const incomplete=maps.some(m=>m.status!=='ok');return {status:incomplete?'unavailable':'ok',maps,rows:maps.map(m=>({name:m.title,value:m.status==='ok'?'地図画像取得（地点判定なし）':'配信範囲・取得状況の確認が必要',note:`取得${m.images.length}/${m.total}枚・画像未配信${m.missing}枚・通信失敗${m.failed}枚`})),source:'ハザードマップポータルサイトをもとに作成（背景地図・中心地点・範囲を重ねて加工）',sourceUrl:'https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html',scope:'選択地点周辺の地図表示・地点の区域内外は未判定',message:'未着色・画像未配信は安全を意味しません。最新の区域は自治体資料で確認してください。この地図は重要事項説明に用いる自治体作成ハザードマップの代わりには使えません。',fetchedAt:new Date().toISOString()};
}
