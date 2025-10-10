import React from"react";import{t,Lang}from"./i18n";
export default function ShareButtons({lang,url,name}:{lang:Lang;url:string;name:string}){const i=t(lang);
const webShare=async()=>{if(navigator.share){try{await navigator.share({title:name,url});}catch{}}};
const mail=`mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(url)}`;
const fb=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
const tw=`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(name)}`;
const wa=`https://wa.me/?text=${encodeURIComponent(name+" "+url)}`;
const copy=async()=>{try{await navigator.clipboard.writeText(url);alert("Copied");}catch{}};
return(<div className="flex flex-wrap gap-3 text-sm"><button className="linklike" onClick={webShare}>{i.share}</button><a className="underline" href={mail}>{i.emailShare}</a><a className="underline" href={fb} target="_blank" rel="noreferrer">{i.fbShare}</a><a className="underline" href={tw} target="_blank" rel="noreferrer">{i.xShare}</a><a className="underline" href={wa} target="_blank" rel="noreferrer">{i.waShare}</a><button className="linklike" onClick={copy}>{i.copyLink}</button></div>);}