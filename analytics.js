(function(){
'use strict';
var tag=document.currentScript,id=tag&&tag.dataset.measurementId;
if(!/^G-[A-Z0-9]+$/.test(id||''))return;
if(window.__inceptionAnalytics)return;window.__inceptionAnalytics=true;
window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
gtag('js',new Date());
gtag('config',id,{page_location:location.origin+location.pathname,allow_google_signals:false,allow_ad_personalization_signals:false});
var script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(script);
document.addEventListener('click',function(event){
var link=event.target.closest&&event.target.closest('a[href]');if(!link)return;
var url;try{url=new URL(link.href,location.href);}catch(e){return;}
var kind=url.protocol==='tel:'?'phone':url.protocol==='mailto:'?'email':url.hostname==='lin.ee'?'line':url.hostname==='docs.google.com'&&url.pathname.indexOf('/forms/')===0?'form':null;
if(kind)gtag('event','contact_click',{contact_method:kind});
if(url.hostname==='asp.athome.jp')gtag('event','property_search_click',{search_path:url.pathname});
},true);
})();
