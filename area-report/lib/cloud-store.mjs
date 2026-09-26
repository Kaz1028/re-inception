import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sdk=()=>require('@vercel/blob');
export const cloudEnabled=()=>!!(process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID);
export async function readCloud(path){const value=await sdk().get(path,{access:'private',useCache:false});if(!value)return null;return new Response(value.stream).json();}
export async function writeCloud(path,value){return sdk().put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});}
