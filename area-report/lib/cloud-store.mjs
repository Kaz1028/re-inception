import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
const require=createRequire(import.meta.url);
const sdk=()=>require('@vercel/blob');
export const cloudEnabled=()=>!!(process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID);
export async function readCloud(path){const value=await sdk().get(path,{access:'private',useCache:false});if(!value)return null;return new Response(value.stream).json();}
export async function writeCloud(path,value){return sdk().put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});}
export async function pdfDownload(pdf){const path='reports/'+randomUUID()+'.pdf';await sdk().put(path,pdf,{access:'private',addRandomSuffix:false,contentType:'application/pdf'});const validUntil=Date.now()+10*60*1000;const token=await sdk().issueSignedToken({pathname:path,operations:['get'],validUntil});const {presignedUrl}=await sdk().presignUrl(token,{operation:'get',pathname:path,access:'private',validUntil});return presignedUrl;}
export async function cleanReports(){const {list,del}=sdk();let cursor;do{const page=await list({prefix:'reports/',cursor,limit:100});const old=page.blobs.filter(b=>Date.now()-new Date(b.uploadedAt).getTime()>86400000);if(old.length)await del(old.map(b=>b.url));cursor=page.hasMore?page.cursor:undefined;}while(cursor);}
