import {authRequired,authorized,passwordValid,signedSession,cookie,loginHtml} from './lib/auth.mjs';
import {cloudEnabled,pdfDownload,cleanReports} from './lib/cloud-store.mjs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createPdf} from './lib/pdf.mjs';
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchAddress,collect,startFacilitySync,refreshFacilitiesCloud} from './lib/data.mjs';
import {validPoint} from './lib/geo.mjs';
import {itemById} from './public/catalog.mjs';
import {workbook} from './lib/xlsx.mjs';
const root=dirname(fileURLToPath(import.meta.url)),publicDir=resolve(root,'public');
try{process.loadEnvFile(resolve(root,'.env'));}catch(e){if(e.code!=='ENOENT')throw e;}
const port=Number(process.env.PORT||4318);
async function rawBody(req,limit){let result;if(req.body!==undefined){result=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));}else{const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>limit)throw Object.assign(Error('データが大きすぎます。'),{status:413});parts.push(part);}result=Buffer.concat(parts);}if(result.length>limit)throw Object.assign(Error('データが大きすぎます。'),{status:413});return result;}
async function body(req,limit=4_000_000){let bytes=await rawBody(req,limit);if(req.headers['content-type']==='application/gzip')bytes=gunzipSync(bytes,{maxOutputLength:32_000_000});try{return JSON.parse(bytes.toString());}catch{throw Object.assign(Error('JSON形式が正しくありません。'),{status:400});}}

function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});const json=Buffer.from(JSON.stringify(data));res.end(json);}
let collecting=false;
const attempts=new Map();
export async function handler(req,res){try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 const url=new URL(req.url,'http://localhost');
 if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'別のサイトからの操作は受け付けられません。'});
 if(url.pathname==='/api/cron/facilities'){if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return send(res,401,{error:'認証が必要です。'});if(req.method!=='GET')return send(res,405,{error:'GET only'});const result=await refreshFacilitiesCloud();if(cloudEnabled())await cleanReports();return send(res,200,result);}
 if(url.pathname==='/login'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(loginHtml.replace('__ERROR__',''));}
 if(authRequired()&&(!process.env.APP_PASSWORD_HASH||!process.env.SESSION_SECRET))return send(res,503,{error:'ログイン設定が未完了です。'});
 if(url.pathname==='/api/login'&&req.method==='POST'){const key=req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown';const now=Date.now();for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);if((attempts.get(key)?.count||0)>=10)return send(res,429,{error:'しばらく時間をおいてください。'});const form=new URLSearchParams((await rawBody(req,4096)).toString());if(!await passwordValid(form.get('password'))){if(attempts.size>1000)attempts.delete(attempts.keys().next().value);attempts.set(key,{count:(attempts.get(key)?.count||0)+1,until:now+900000});res.writeHead(401,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(loginHtml.replace('__ERROR__','パスワードを確認してください。'));}attempts.delete(key);res.writeHead(303,{'Location':'/','Set-Cookie':cookie(signedSession()),'Cache-Control':'no-store'});return res.end();}
 if(url.pathname==='/api/logout'&&req.method==='POST'){res.writeHead(303,{'Location':'/login','Set-Cookie':cookie('',true)});return res.end();}
 if(!authorized(req)){if(url.pathname.startsWith('/api/'))return send(res,401,{error:'ログインし直してください。'});res.writeHead(302,{'Location':'/login','Cache-Control':'no-store'});return res.end();}
 if(url.pathname==='/api/config')return send(res,200,{mlit:!!process.env.REINFOLIB_API_KEY});
 if(url.pathname==='/api/search'&&req.method==='GET'){const q=(url.searchParams.get('q')||'').trim();if(q.length<2||q.length>160)return send(res,400,{error:'住所は2〜160文字で入力してください。'});return send(res,200,await searchAddress(q));}
 if(url.pathname==='/api/report'&&req.method==='POST'){const data=await body(req);if(!data||!validPoint(data.point)||![500,1000,2000].includes(data.radius)||!Array.isArray(data.selected)||!data.selected.length||data.selected.some(id=>typeof id!=='string'||!Object.hasOwn(itemById,id))||new Set(data.selected).size!==data.selected.length)return send(res,400,{error:'地点・調査範囲・選択項目を確認してください。'});if(collecting)return send(res,429,{error:'別の調査を実行中です。完了後にもう一度お試しください。'});collecting=true;try{const report=await collect(data);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Encoding':'gzip','Cache-Control':'no-store'});return res.end(gzipSync(JSON.stringify(report)));}finally{collecting=false;}}
 if(url.pathname==='/api/pdf'&&req.method==='POST'){const data=await body(req,32_000_000);const pdf=await createPdf(data?.html);if(process.env.VERCEL){if(!cloudEnabled())throw Error('PDF保存先が未設定です。');return send(res,200,{url:await pdfDownload(pdf)});}res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="area-report.pdf"','Cache-Control':'no-store'});return res.end(pdf);}
 if(url.pathname==='/api/excel'&&req.method==='POST'){const data=await body(req);if(!data||!Array.isArray(data.rows)||data.rows.length>10000||data.rows.some(r=>!Array.isArray(r)||r.length>12||r.some(c=>typeof c!=='string'||c.length>10000)))return send(res,400,{error:'出力データが正しくありません。'});res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="area-report.xlsx"'});return res.end(workbook(data.rows));}
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'この操作は利用できません。'});
 const path=resolve(publicDir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(publicDir+sep))return send(res,403,{error:'このパスは利用できません。'});if(!(await stat(path)).isFile())return send(res,404,{error:'ページが見つかりません。'});
 const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:await readFile(path));
 }catch(e){send(res,e.status||(e.code==='ENOENT'?404:502),{error:e.code==='ENOENT'?'ページが見つかりません。':e.message||'データを取得できませんでした。'});}}
const server=http.createServer(handler);
if(!process.env.VERCEL)server.listen(port,'127.0.0.1',()=>console.log(`INCEPTION Area Report: http://127.0.0.1:${port}`));

if(!process.env.VERCEL&&process.env.FACILITY_STORE_DISABLED!=='1')startFacilitySync();
