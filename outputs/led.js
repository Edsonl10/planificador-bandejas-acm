(function(){
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',state={source:null,ratio:1,modules:[],groups:[],selected:-1,ctx:null,busy:false,dirty:false,worker:null};
const number=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
function msg(t,error=false){$('status').textContent=t;$('status').classList.toggle('error',error);}
function svgEl(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function isStrip(){return $('ledType').value==='strip';}
function quantity(){return{length:+$(isStrip()?'cutStep':'length').value*10,width:+$('width').value*10,gap:+$('gap').value*10,edge:+$('edge').value*10,rowGap:+$('rowGap').value*10,mode:$('mode').value,orientation:+$('orientation').value,type:$('ledType').value};}
function params(){const p=quantity(),widthMM=+$('artWidth').value*10;return{...p,widthMM,heightMM:widthMM/state.ratio};}
function options(){const p=params(),strip=isStrip();$('cutField').classList.toggle('hidden',!strip);$('lengthField').classList.toggle('hidden',strip);$('rowField').classList.toggle('hidden',p.mode!=='fill');$('orientationField').classList.toggle('hidden',p.mode!=='fill');$('widthCaption').textContent=strip?'Largura da fita (cm)':'Largura do módulo (cm)';$('gapCaption').textContent=strip?'Vão livre entre trechos (cm)':'Vão livre entre módulos (cm)';$('totalLabel').textContent=strip?'metros de fita no layout':'módulos no layout';$('reserveLabel').textContent=strip?'metros de fita com reserva':'quantidade com reserva';$('groupUnit').textContent=strip?'Metros de fita':'Módulos';$('modeHelp').textContent={central:'Uma fileira no meio dos traços, respeitando a distância mínima da borda.',border:'Percorre os contornos externos e os vazados internos com o afastamento informado.',fill:'Fileiras paralelas preenchem o interior da letra, respeitando a margem e os dois espaçamentos.'}[p.mode];$('artHeight').value=Number.isFinite(p.heightMM)?number(p.heightMM/10):'';$('pitch').textContent=`${number(p.length/10)} cm de ${strip?'trecho':'módulo'} + ${number(p.gap/10)} cm livres = ${number((p.length+p.gap)/10)} cm entre centros.`;$('gapLabel').textContent=number(p.gap/10)+' cm livres';}
function setSource(text,name){
 if(state.busy){state.worker?.terminate();state.busy=false;}
 const parsed=LedSvg.parse(text);state.source=parsed.node;state.ratio=parsed.ratio;state.modules=[];state.groups=[];state.ctx=null;state.selected=-1;state.dirty=false;
 $('project').value=name.replace(/\.svg$/i,'');$('artWidth').value=(parsed.widthMM/10).toFixed(2);$('generate').disabled=false;$('generate').textContent='Distribuir módulos';options();paint();summary();msg('SVG importado. Confira a largura real e clique em Distribuir módulos.');
}
function markDirty(){options();if(state.ctx){state.dirty=true;state.selected=-1;summary();msg('As medidas mudaram. Distribua novamente para atualizar o layout.');}else if(state.source)paint();}
function lockControls(lock){for(const id of ['file','example','artWidth','length','width','gap','edge','rowGap','cutStep','mode','orientation','ledType','project'])$(id).disabled=lock;}
function validReserve(){const value=$('reserve').value;return value.trim()!==''&&Number.isFinite(+value)&&+value>=0&&+value<=100;}
function exportAllowed(){return !!state.ctx&&!state.dirty&&!state.busy&&validReserve();}
function summary(){
 const valid=exportAllowed(),strip=state.ctx?.type==='strip',raw=strip?state.modules.length*state.ctx.length/1000:state.modules.length,totalReserve=raw*(1+(+$('reserve').value||0)/100);$('total').textContent=valid?(strip?number(raw)+' m':raw):'—';$('withReserve').textContent=valid?(strip?number(Math.ceil(state.modules.length*(1+(+$('reserve').value||0)/100))*state.ctx.length/1000)+' m':Math.ceil(totalReserve)):'—';$('shapeCount').textContent=valid?state.groups.length:'—';
 document.querySelectorAll('.export').forEach(e=>e.disabled=!valid);
 $('delete').disabled=!valid||state.selected<0;$('rotation').disabled=!valid||state.selected<0;
 $('groups').replaceChildren();if(!valid){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=2;td.textContent=state.dirty?'Distribua novamente após alterar as medidas.':'Gere a distribuição para contar.';tr.append(td);$('groups').append(tr);return;}
 for(const g of state.groups){const tr=document.createElement('tr'),td=document.createElement('td'),count=document.createElement('td'),input=document.createElement('input');input.value=g.name;input.maxLength=80;input.setAttribute('aria-label','Nome do elemento '+(g.id+1));input.oninput=()=>{g.name=input.value;paint();};td.append(input);const n=state.modules.filter(m=>m.group===g.id).length;count.textContent=strip?number(n*state.ctx.length/1000)+' m':n;tr.append(td,count);$('groups').append(tr);}
}
function makeDrawing(exporting=false){
 const p=state.ctx?{widthMM:state.ctx.widthMM,heightMM:state.ctx.heightMM,length:state.ctx.length,width:state.ctx.width,gap:state.ctx.gap,edge:state.ctx.edge,mode:state.ctx.mode,type:state.ctx.type,rowGap:state.ctx.rowGap}:params();
 const w=p.widthMM,h=p.heightMM,font=Math.max(12,w/85),pad=font*3.3,top=font*4.7,bottom=font*5.5;
 const root=svgEl('svg',{xmlns:NS,viewBox:`${-pad} ${-top} ${w+2*pad} ${h+top+bottom}`,width:(w+2*pad)+'mm',height:(h+top+bottom)+'mm','font-family':'DejaVu Sans, Arial, sans-serif'});
 root.append(svgEl('rect',{x:-pad,y:-top,width:w+2*pad,height:h+top+bottom,fill:'#f8fafc'}));
 root.append(svgEl('text',{x:0,y:-font*2.8,'font-size':font*1.2,'font-weight':700,fill:'#263f4f'},$('project').value||'Letreiro LED'));
 root.append(svgEl('text',{x:0,y:-font*1.65,'font-size':font*.7,fill:'#647786'},'Distribuição de módulos LED · iluminação retroversa'));
 root.append(svgEl('text',{x:w,y:-font*2.8,'font-size':font*1.1,'text-anchor':'end','font-weight':700,fill:'#087d77'},state.ctx?(p.type==='strip'?number(state.modules.length*p.length/1000)+' m de fita':state.modules.length+' módulos'):''));
 root.append(svgEl('line',{x1:0,y1:-font*.65,x2:w,y2:-font*.65,stroke:'#97aab7','stroke-width':font*.04}));
 root.append(svgEl('text',{x:w/2,y:-font*.9,'font-size':font*.7,'text-anchor':'middle',fill:'#526877'},number(w/10)+' × '+number(h/10)+' cm'));
 const art=state.source.cloneNode(true);art.setAttribute('x',0);art.setAttribute('y',0);art.setAttribute('width',w);art.setAttribute('height',h);root.append(art);
 state.modules.forEach((m,i)=>root.append(svgEl('rect',{x:-p.length/2,y:-p.width/2,width:p.length,height:p.width,rx:Math.min(1,p.width/5),fill:'#f9ca46',transform:`translate(${m.x} ${m.y}) rotate(${m.angle})`,class:'module'+(!exporting&&state.selected===i?' selected':''),'data-index':i})));
 root.append(svgEl('text',{x:0,y:h+font*1.55,'font-size':font*.72,'font-weight':600,fill:'#263f4f'},`${p.type==='strip'?'Trecho de fita':'Módulo'}: ${number(p.length/10)} × ${number(p.width/10)} cm · Vão livre: ${number(p.gap/10)} cm · Borda: ${number((p.edge||0)/10)} cm`));
 root.append(svgEl('text',{x:0,y:h+font*2.65,'font-size':font*.64,fill:'#647786'},({central:'LED central',border:'Acompanhando a borda',fill:'Preenchimento total'}[p.mode]||'LED central')+' · distribuição indicativa · conferir curvas e encontros.'));
 if(state.groups.length){const names=state.groups.map(g=>`${g.name}: ${p.type==='strip'?number(state.modules.filter(m=>m.group===g.id).length*p.length/1000)+' m':state.modules.filter(m=>m.group===g.id).length}`).join('  |  ');let rows=[''];for(const word of names.split(' ')){const last=rows.length-1;if((rows[last]+' '+word).length>115&&rows.length<2)rows.push(word);else rows[last]+=' '+word;}rows.forEach((row,i)=>root.append(svgEl('text',{x:0,y:h+font*(3.75+i*.8),'font-size':font*.58,fill:'#526877'},row.trim())));}
 return root;
}
function paint(){if(!state.source)return;$('drawingTitle').textContent=$('project').value||'Prévia do letreiro';$('view').replaceChildren(makeDrawing());}
async function raster(){
 const fields=[['artWidth','largura do desenho',.1,10000],['width',isStrip()?'largura da fita':'largura do módulo',.1,100],['gap','vão livre',0,100],['edge','distância da borda',0,100],isStrip()?['cutStep','intervalo de corte',.5,100]:['length','comprimento do módulo',.1,100]];
 if($('mode').value==='fill')fields.push(['rowGap','vão entre fileiras',0,100]);
 for(const [id,label,min,max] of fields){const value=$(id).value;if(value.trim()===''||!Number.isFinite(+value)||+value<min||+value>max)throw Error(`Confira ${label}: informe um valor entre ${number(min)} e ${number(max)} cm.`);}
 const p=params();if(!(p.widthMM>0&&p.widthMM<=100000&&p.heightMM>0&&p.heightMM<=100000&&p.length>0&&p.width>0&&p.gap>=0&&p.edge>=0&&(p.mode!=='fill'||p.rowGap>=0)))throw Error('Confira as medidas: valores positivos e letreiro de até 100 m.');
 const longest=Math.max(p.widthMM,p.heightMM),factor=Math.min(1600/longest,4/Math.min(p.length,p.width)),w=Math.max(12,Math.ceil(p.widthMM*factor)),h=Math.max(12,Math.ceil(p.heightMM*factor));
 if(w*h>1600*1600)throw Error('Desenho muito grande para esta resolução.');
 const svg=state.source.cloneNode(true);svg.setAttribute('width',w);svg.setAttribute('height',h);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(Error('Não foi possível rasterizar o SVG.'));img.src=url;});const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);const data=ctx.getImageData(0,0,w,h).data,mask=new Uint8Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=data[i*4+3]>127?1:0;if(!mask.some(v=>v))throw Error('O desenho está vazio.');return{...p,mask,w,h,sx:p.widthMM/w,sy:p.heightMM/h};}finally{URL.revokeObjectURL(url);}
}
async function generate(){
 if(!state.source||state.busy)return;if(!validReserve()){msg('Informe uma reserva entre 0 e 100%.',true);summary();return;}state.busy=true;lockControls(true);$('generate').disabled=true;$('generate').textContent='Calculando…';summary();msg('Identificando os traços e distribuindo os módulos…');
 try{
  const ctx=await raster();state.worker?.terminate();const worker=state.worker=new Worker('led-worker.js?v=20261028-1');
  const result=await new Promise((resolve,reject)=>{worker.onmessage=e=>e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Não foi possível calcular. Abra o planificador pelo endereço do NAS.'));worker.postMessage(ctx);});worker.terminate();state.worker=null;
  ctx.distance=result.distance;ctx.groupMap=result.groupMap;state.ctx=ctx;state.modules=result.modules;state.groups=result.groups;state.selected=-1;state.dirty=false;state.busy=false;paint();summary();
  const resultLabel=ctx.type==='strip'?`${number(state.modules.length*ctx.length/1000)} m de fita em ${state.modules.length} trechos`:`${state.modules.length} módulos`;
  msg(result.unplaced?`${resultLabel} distribuídos. ${result.unplaced} elemento(s) sem espaço para este módulo: confira as medidas.`:`${resultLabel} distribuídos. Confira as curvas e os encontros antes de exportar.`);
 }catch(e){state.busy=false;state.worker?.terminate();state.worker=null;msg(e.message,true);summary();}
 finally{lockControls(false);$('generate').disabled=false;$('generate').textContent='Distribuir módulos';}
}
function coordinates(event){const root=$('view').querySelector('svg'),p=root.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(root.getScreenCTM().inverse());}
function currentGroup(x,y){const ctx=state.ctx;if(!ctx)return null;if(ctx.groupMap){const ix=Math.floor(x/ctx.sx),iy=Math.floor(y/ctx.sy);if(ix<0||iy<0||ix>=ctx.w||iy>=ctx.h)return null;const id=ctx.groupMap[iy*ctx.w+ix]-1;return id>=0?id:null;}let best=null,distance=Infinity;for(const m of state.modules){const d=Math.hypot(m.x-x,m.y-y);if(d<distance){distance=d;best=m.group;}}return best;}
function select(i){state.selected=i;if(i>=0)$('rotation').value=Number(state.modules[i].angle.toFixed(1));paint();summary();}
let drag=null;
$('view').addEventListener('pointerdown',e=>{if(!exportAllowed())return;const m=e.target.closest('[data-index]');if(!m)return;const i=+m.dataset.index,p=coordinates(e);drag={i,dx:p.x-state.modules[i].x,dy:p.y-state.modules[i].y,old:{...state.modules[i]},pointer:e.pointerId};select(i);$('view').setPointerCapture(e.pointerId);});
$('view').addEventListener('pointermove',e=>{if(!drag)return;const p=coordinates(e),m={...state.modules[drag.i],x:p.x-drag.dx,y:p.y-drag.dy},group=currentGroup(m.x,m.y);if(group!==null&&LedEngine.fits(m,state.ctx,state.modules,drag.i)){m.group=group;state.modules[drag.i]=m;paint();}});
function endDrag(){if(!drag)return;drag=null;summary();} $('view').addEventListener('pointerup',endDrag);$('view').addEventListener('pointercancel',endDrag);
$('view').addEventListener('dblclick',e=>{if(!exportAllowed()||e.target.closest('[data-index]'))return;const p=coordinates(e),group=currentGroup(p.x,p.y),m={x:p.x,y:p.y,angle:0,group};if(group!==null&&LedEngine.fits(m,state.ctx,state.modules)){state.modules.push(m);select(state.modules.length-1);msg('LED adicionado. Ajuste a rotação se necessário.');}else msg('Sem espaço nesta posição para o módulo e o vão configurado.',true);});
$('delete').onclick=()=>{if(state.selected<0)return;state.modules.splice(state.selected,1);select(-1);};$('clearSelection').onclick=()=>select(-1);
$('rotation').onchange=()=>{if(state.selected<0)return;const m={...state.modules[state.selected],angle:+$('rotation').value};if(Number.isFinite(m.angle)&&LedEngine.fits(m,state.ctx,state.modules,state.selected)){state.modules[state.selected]=m;paint();}else{msg('A rotação ultrapassa a letra ou reduz o vão livre.',true);$('rotation').value=state.modules[state.selected].angle.toFixed(1);}};
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function filename(){return($('project').value||'Letreiro_LED').replace(/[^\p{L}\p{N}_.-]+/gu,'_').slice(0,100)+'_LED';}
$('svgExport').onclick=()=>{if(exportAllowed())save(new Blob([new XMLSerializer().serializeToString(makeDrawing(true))],{type:'image/svg+xml'}),filename()+'.svg');};
$('pngExport').onclick=async()=>{if(!exportAllowed())return;let url;try{const svg=makeDrawing(true),vb=svg.viewBox.baseVal,w=3000,h=Math.ceil(w*vb.height/vb.width);svg.setAttribute('width',w);svg.setAttribute('height',h);url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0);c.toBlob(blob=>{if(blob)save(blob,filename()+'.png');else msg('Falha ao exportar PNG.',true);},'image/png');}catch{msg('Não foi possível exportar o PNG.',true);}finally{if(url)URL.revokeObjectURL(url);}};
$('print').onclick=()=>{if(exportAllowed()){select(-1);window.print();}};
$('file').onchange=async()=>{try{if($('file').files[0])setSource(await $('file').files[0].text(),$('file').files[0].name);}catch(e){msg(e.message,true);}finally{$('file').value='';}};
$('example').onclick=()=>setSource('<svg xmlns="http://www.w3.org/2000/svg" width="2000mm" height="700mm" viewBox="0 0 2000 700"><path d="M60 40H200V520H600V660H60Z"/><path d="M730 40H1260V180H870V280H1180V420H870V520H1260V660H730Z"/><path fill-rule="evenodd" d="M1390 40H1660C2050 40 2050 660 1660 660H1390ZM1530 180V520H1650C1840 520 1840 180 1650 180Z"/></svg>','Exemplo_LED.svg');
for(const id of ['artWidth','length','width','gap','edge','rowGap','cutStep'])$(id).oninput=markDirty;
$('mode').onchange=markDirty;$('orientation').onchange=markDirty;$('ledType').onchange=()=>{$('gap').value=isStrip()?'0':'3';markDirty();};$('reserve').oninput=()=>{summary();if(!validReserve())msg('Informe uma reserva entre 0 e 100%.',true);else if(state.ctx&&!state.dirty)msg('Reserva atualizada.');};$('project').oninput=paint;$('generate').onclick=generate;options();
})();
