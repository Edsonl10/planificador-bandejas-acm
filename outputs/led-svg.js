/* Importação local de SVGs; mantém somente geometria e estilos seguros. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg',ART_ID='led-svg-artwork';
function svgEl(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [name,value] of Object.entries(attrs))el.setAttribute(name,value);return el;}
function physical(value){const m=String(value||'').trim().match(/^([0-9]*\.?[0-9]+)(mm|cm|in|pt|px|m)?$/i);if(!m)return null;return +m[1]*({mm:1,cm:10,in:25.4,pt:25.4/72,px:25.4/96,m:1000}[m[2]?.toLowerCase()||'px']);}
function safeProperty(name,value){
 name=name.trim().toLowerCase();value=value.trim();const lower=value.toLowerCase();
 if(!value||/[<>]/.test(value))return null;
 if(name==='fill'||name==='stroke')return [name,lower==='none'||lower==='transparent'?'none':lower==='inherit'?'inherit':'#263540'];
 if(name==='fill-rule'||name==='clip-rule')return /^(evenodd|nonzero|inherit)$/.test(lower)?[name,lower]:null;
 if(name==='opacity'||name==='fill-opacity'||name==='stroke-opacity')return /^(?:0(?:\.\d+)?|1(?:\.0+)?|\.\d+|\d+(?:\.\d+)?%)$/.test(lower)?[name,lower]:null;
 if(name==='stroke-width')return /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|pt|mm|cm|in|%)?$/i.test(value)?[name,value]:null;
 if(name==='stroke-linecap')return /^(butt|round|square|inherit)$/.test(lower)?[name,lower]:null;
 if(name==='stroke-linejoin')return /^(miter|round|bevel|inherit)$/.test(lower)?[name,lower]:null;
 if(name==='display')return /^(none|inline|inherit)$/.test(lower)?[name,lower]:null;
 if(name==='visibility')return /^(visible|hidden|collapse|inherit)$/.test(lower)?[name,lower]:null;
 if(name==='clip-path')return /^url\(\s*['"]?#[a-z_][\w.-]*['"]?\s*\)$/i.test(value)?[name,value]:lower==='none'?[name,'none']:null;
 return null;
}
function declarations(text){return String(text||'').split(';').map(part=>{const at=part.indexOf(':');return at<0?null:safeProperty(part.slice(0,at),part.slice(at+1));}).filter(Boolean).map(([k,v])=>`${k}:${v}`).join(';');}
function stylesheet(text){
 const result=[],css=String(text||'').replace(/\/\*[\s\S]*?\*\//g,'');let match;const rules=/([^{}]+)\{([^{}]*)\}/g;
 const atom='(?:\\*|[a-zA-Z_][\\w-]*)?(?:[.#][a-zA-Z_][\\w-]*)*',selector=new RegExp('^'+atom+'(?:\\s+'+atom+')*$');
 while((match=rules.exec(css))){const body=declarations(match[2]);if(!body)continue;const selectors=match[1].split(',').map(x=>x.trim()).filter(x=>x&&selector.test(x));if(selectors.length)result.push(selectors.map(x=>`#${ART_ID} ${x}`).join(',')+'{'+body+'}');}
 return result.join('\n');
}
function sanitizeDocument(doc){
 const src=doc.documentElement;
 if(doc.querySelector('parsererror')||!src||src.localName!=='svg')throw Error('Arquivo SVG inválido.');
 if(doc.querySelector('text'))throw Error('Converta os textos em curvas no Corel e exporte novamente.');
 if(doc.querySelector('use,image,foreignObject'))throw Error('Exporte somente os vetores, sem imagens ou clones vinculados.');
 const box=src.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);let mmW=physical(src.getAttribute('width')),mmH=physical(src.getAttribute('height'));
 const vb=box?.length===4&&box.every(Number.isFinite)&&box[2]>0&&box[3]>0?box:[0,0,mmW?mmW*96/25.4:0,mmH?mmH*96/25.4:0];
 if(!(vb[2]>0&&vb[3]>0))throw Error('O SVG precisa de dimensões ou viewBox.');
 const ratio=mmW&&mmH?mmW/mmH:vb[2]/vb[3];if(!Number.isFinite(ratio)||ratio<.025||ratio>80)throw Error('Proporção do SVG fora do limite.');
 const clean=svgEl('svg',{xmlns:NS,id:ART_ID,viewBox:vb.join(' '),fill:'#263540','fill-rule':'nonzero',preserveAspectRatio:'none'});
 const presentations=['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','clip-rule','fill-opacity','stroke-opacity','opacity','display','visibility','clip-path'];
 function presentation(node,out){for(const name of presentations){const value=node.getAttribute(name),safe=value===null?null:safeProperty(name,value);if(safe)out.setAttribute(...safe);}const style=declarations(node.getAttribute('style'));if(style)out.setAttribute('style',style);}
 presentation(src,clean);
 const css=Array.from(doc.querySelectorAll('style')).map(s=>stylesheet(s.textContent)).filter(Boolean).join('\n');if(css){const style=svgEl('style');style.textContent=css;clean.append(style);}
 const allowed=new Set(['g','path','rect','circle','ellipse','polygon','polyline','line','svg','defs','clipPath']);
 const geometry=['d','x','y','x1','x2','y1','y2','width','height','rx','ry','cx','cy','r','points','transform','viewBox','preserveAspectRatio','clipPathUnits'];let shapes=0;
 function copy(parent,dest,inDefs=false){for(const node of parent.children){if(!allowed.has(node.localName))continue;const out=svgEl(node.localName),defs=inDefs||node.localName==='defs'||node.localName==='clipPath';
  for(const name of geometry){const value=node.getAttribute(name);if(value&&!/url\s*\(|https?:|javascript:|[<>]/i.test(value))out.setAttribute(name,value);}
  const id=node.getAttribute('id'),classes=node.getAttribute('class');if(id&&/^[a-z_][\w.-]*$/i.test(id)&&id!==ART_ID)out.setAttribute('id',id);if(classes&&/^[\w .-]+$/.test(classes))out.setAttribute('class',classes);
  presentation(node,out);if(!defs&&!['g','svg'].includes(node.localName))shapes++;copy(node,out,defs);dest.append(out);
 }}
 copy(src,clean);if(!shapes)throw Error('Nenhuma forma vetorial encontrada.');if(shapes>3000)throw Error('Muitas formas no SVG. Simplifique o vetor antes de importar.');
 return{node:clean,ratio,widthMM:mmW||vb[2]*25.4/96};
}
function parse(text){if(text.length>4e6)throw Error('O SVG deve ter no máximo 4 MB.');if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(text))throw Error('Exporte o SVG sem entidades internas.');text=text.replace(/<!DOCTYPE[^>]*>/gi,'');return sanitizeDocument(new DOMParser().parseFromString(text,'image/svg+xml'));}
const api={parse,sanitizeDocument,declarations,stylesheet};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LedSvg=api;
})(typeof self!=='undefined'?self:globalThis);
