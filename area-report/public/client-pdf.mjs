// All rendering happens in this browser. No report upload or cloud PDF storage.
let libraries;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>{el.remove();reject(Error('PDF作成機能を読み込めませんでした。再度お試しください。'));};document.head.append(el);});}
async function loadLibraries(){
 if(!libraries)libraries=(async()=>{if(!window.html2canvas)await script('/vendor/html2canvas.min.js');if(!window.jspdf)await script('/vendor/jspdf.umd.min.js');})().catch(err=>{libraries=null;throw err;});
 return libraries;
}
export async function createClientPdf(html,onProgress=()=>{}){
 await loadLibraries();
 const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;left:-10000px;top:0;width:850px;height:1200px;border:0;pointer-events:none';
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('レポートの読み込みに時間がかかっています。再度お試しください。')),45000);frame.onload=()=>{clearTimeout(timer);resolve();};frame.srcdoc=html;document.body.append(frame);});
  const doc=frame.contentDocument;await doc.fonts.ready;
  if([...doc.images].some(img=>!img.complete||!img.naturalWidth))throw Error('地図・画像を取得できませんでした。通信を確認して再度PDF保存をお試しください。');
  const pages=[...doc.querySelectorAll('.page')];if(!pages.length)throw Error('保存するページがありません。');
  const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  for(let i=0;i<pages.length;i++){
   onProgress(i+1,pages.length);await new Promise(resolve=>setTimeout(resolve,0));
   // Render one A4 page at a time to bound mobile canvas memory.
   const canvas=await window.html2canvas(pages[i],{scale:1.5,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,imageTimeout:30000,windowWidth:850,windowHeight:1200});
   try{if(i)pdf.addPage();const height=canvas.height*210/canvas.width;if(height>298)throw Error('ページの内容がA4を超えています。項目を分けて作成してください。');pdf.addImage(canvas.toDataURL('image/jpeg',0.94),'JPEG',0,0,210,Math.min(height,297));}
   finally{canvas.width=0;canvas.height=0;}
  }
  return pdf.output('arraybuffer');
 }finally{frame.remove();}
}
