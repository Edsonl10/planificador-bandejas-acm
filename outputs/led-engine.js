/* Geometria local para estimativas de distribuição de módulos LED. Sem rede. */
(function(root){
'use strict';
function thin(mask,w,h){
 // Trate a área fora do SVG como fundo, inclusive quando uma forma toca a borda.
 const pw=w+2,ph=h+2,s=new Uint8Array(pw*ph),remove=[];let changed=true,rounds=0;
 for(let y=0;y<h;y++)s.set(mask.subarray(y*w,(y+1)*w),(y+1)*pw+1);
 while(changed&&rounds++<Math.max(pw,ph)){changed=false;
  for(let pass=0;pass<2;pass++){
   remove.length=0;
   for(let y=1;y<ph-1;y++)for(let x=1;x<pw-1;x++){
    const i=y*pw+x;if(!s[i])continue;
    const p=[s[i-pw],s[i-pw+1],s[i+1],s[i+pw+1],s[i+pw],s[i+pw-1],s[i-1],s[i-pw-1]];
    const count=p.reduce((a,b)=>a+b,0);if(count<2||count>6)continue;
    let changes=0;for(let j=0;j<8;j++)if(!p[j]&&p[(j+1)%8])changes++;
    if(changes!==1)continue;
    if(pass===0?(p[0]*p[2]*p[4]||p[2]*p[4]*p[6]):(p[0]*p[2]*p[6]||p[0]*p[4]*p[6]))continue;
    remove.push(i);
   }
   if(remove.length)changed=true;for(const i of remove)s[i]=0;
  }
 }
 const result=new Uint8Array(mask.length);
 for(let y=0;y<h;y++)result.set(s.subarray((y+1)*pw+1,(y+1)*pw+1+w),y*w);
 return result;
}
function components(mask,w,h){
 const labels=new Int32Array(mask.length),queue=new Int32Array(mask.length),groups=[];let next=0;
 for(let start=0;start<mask.length;start++){
  if(!mask[start]||labels[start])continue;
  let front=0,back=1;queue[0]=start;labels[start]=++next;
  const g={id:next,minX:w,minY:h,maxX:0,maxY:0,area:0,sumX:0,sumY:0};
  while(front<back){const i=queue[front++],x=i%w,y=(i/w)|0;g.area++;g.sumX+=x;g.sumY+=y;g.minX=Math.min(g.minX,x);g.maxX=Math.max(g.maxX,x);g.minY=Math.min(g.minY,y);g.maxY=Math.max(g.maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const j=yy*w+xx;if(mask[j]&&!labels[j]){labels[j]=next;queue[back++]=j;}}
  }
  groups.push(g);
 }
 return {labels,groups};
}
function chains(s,w,h,sx,sy,groups,labels){
 const indexes=new Map(),pixels=[];
 for(let i=0;i<s.length;i++)if(s[i]){indexes.set(i,pixels.length);pixels.push(i);}
 const adj=pixels.map(()=>[]),dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
 pixels.forEach((i,n)=>{const x=i%w,y=(i/w)|0;for(const [dx,dy]of dirs){if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;const j=indexes.get(i+dy*w+dx);if(j===undefined)continue;if(dx&&dy&&(indexes.has(i+dy*w)||indexes.has(i+dx)))continue;adj[n].push(j);}});
 const visited=new Set(),out=groups.map(g=>({...g,edges:[],anchors:[]}));const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const order=pixels.map((_,i)=>i).sort((a,b)=>(adj[a].length===2)-(adj[b].length===2));
 for(const start of order)for(const neighbor of adj[start]){
  if(visited.has(key(start,neighbor)))continue;
  const seq=[start];let prev=start,cur=neighbor;visited.add(key(prev,cur));
  while(true){seq.push(cur);if(adj[cur].length!==2)break;const next=adj[cur][0]===prev?adj[cur][1]:adj[cur][0];if(visited.has(key(cur,next)))break;prev=cur;cur=next;visited.add(key(prev,cur));}
  const closed=seq[0]===seq[seq.length-1];let pts=seq.map(n=>({x:((pixels[n]%w)+.5)*sx,y:(((pixels[n]/w)|0)+.5)*sy}));
  if(pts.length>6){const old=pts;pts=old.map((p,i)=>{if(!closed&&(i===0||i===old.length-1))return p;let x=0,y=0,total=0;for(let d=-3;d<=3;d++){const j=closed?(i+d+old.length-1)%(old.length-1):Math.max(0,Math.min(old.length-1,i+d)),weight=4-Math.abs(d);x+=old[j].x*weight;y+=old[j].y*weight;total+=weight;}return{x:x/total,y:y/total};});if(closed)pts[pts.length-1]={...pts[0]};}
  let len=0;const distances=[0];for(let i=1;i<pts.length;i++){len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);distances.push(len);}
  if(len>Math.min(sx,sy)*2)out[labels[pixels[start]]-1].edges.push({pts,distances,len,closed,start:adj[start].length>2?start:null,end:adj[seq[seq.length-1]].length>2?seq[seq.length-1]:null});
 }
 return out;
}
function onPath(edge,d){
 const a=edge.distances;let lo=0,hi=a.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(a[m]<d)lo=m;else hi=m;}const t=(d-a[lo])/(a[hi]-a[lo]||1),p=edge.pts[lo],q=edge.pts[hi];return{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};
}
function sample(edge,d){const p=onPath(edge,d),a=onPath(edge,Math.max(0,d-15)),b=onPath(edge,Math.min(edge.len,d+15));return{...p,angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI};}
function corners(m,length,width){const a=m.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:m.x+x*length/2*c-y*width/2*s,y:m.y+x*length/2*s+y*width/2*c}));}
function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function cross(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function inside(p,poly){let sign=0;for(let i=0;i<poly.length;i++){const c=cross(poly[i],poly[(i+1)%poly.length],p);if(Math.abs(c)<1e-8)continue;if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c);}return true;}
function polygonDistance(a,b){if(inside(a[0],b)||inside(b[0],a))return 0;let best=Infinity;for(let i=0;i<4;i++)for(let j=0;j<4;j++){const aa=a[i],ab=a[(i+1)%4],ba=b[j],bb=b[(j+1)%4];if(cross(aa,ab,ba)*cross(aa,ab,bb)<0&&cross(ba,bb,aa)*cross(ba,bb,ab)<0)return 0;best=Math.min(best,pointSegment(aa,ba,bb),pointSegment(ab,ba,bb),pointSegment(ba,aa,ab),pointSegment(bb,aa,ab));}return best;}
function distanceField(mask,w,h,sx,sy){
 const d=new Float32Array(mask.length),diag=Math.hypot(sx,sy),far=(w*sx+h*sy)*2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;d[i]=mask[i]?Math.min(far,(x+.5)*sx,(w-x-.5)*sx,(y+.5)*sy,(h-y-.5)*sy):0;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!mask[i])continue;let v=d[i];if(x)v=Math.min(v,d[i-1]+sx);if(y)v=Math.min(v,d[i-w]+sy);if(x&&y)v=Math.min(v,d[i-w-1]+diag);if(x+1<w&&y)v=Math.min(v,d[i-w+1]+diag);d[i]=v;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!mask[i])continue;let v=d[i];if(x+1<w)v=Math.min(v,d[i+1]+sx);if(y+1<h)v=Math.min(v,d[i+w]+sy);if(x+1<w&&y+1<h)v=Math.min(v,d[i+w+1]+diag);if(x&&y+1<h)v=Math.min(v,d[i+w-1]+diag);d[i]=v;}
 return d;
}
function contours(mask,w,h,sx,sy,labels,distance,offset){
 const allowed=new Uint8Array(mask.length),segments=[],at=new Map();
 for(let i=0;i<mask.length;i++)allowed[i]=mask[i]&&distance[i]>=offset+Math.hypot(sx,sy)/2?1:0;
 function edge(x1,y1,x2,y2,label){const id=segments.length;segments.push({a:{x:x1*sx,y:y1*sy},b:{x:x2*sx,y:y2*sy},from:y1*(w+1)+x1,to:y2*(w+1)+x2,label});const key=y1*(w+1)+x1;if(!at.has(key))at.set(key,[]);at.get(key).push(id);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!allowed[i])continue;const label=labels[i];if(!y||!allowed[i-w])edge(x,y,x+1,y,label);if(x===w-1||!allowed[i+1])edge(x+1,y,x+1,y+1,label);if(y===h-1||!allowed[i+w])edge(x+1,y+1,x,y+1,label);if(!x||!allowed[i-1])edge(x,y+1,x,y,label);}
 const used=new Uint8Array(segments.length),out=[];
 for(let k=0;k<segments.length;k++){if(used[k])continue;const first=segments[k],pts=[first.a];let current=k;
  while(!used[current]){const e=segments[current];used[current]=1;pts.push(e.b);const next=(at.get(e.to)||[]).filter(j=>!used[j]&&segments[j].label===first.label);if(!next.length)break;current=next[0];}
  if(pts.length<5)continue;
  // Smooth stair steps while preserving the inset; fit checks enforce the margin.
  let smooth=pts.map((p,i)=>{const size=pts.length-1;let x=0,y=0;for(let j=-2;j<=2;j++){const q=pts[(i+j+size)%size];x+=q.x;y+=q.y;}return{x:x/5,y:y/5};});smooth[smooth.length-1]={...smooth[0]};
  let len=0,distances=[0];for(let j=1;j<smooth.length;j++){len+=Math.hypot(smooth[j].x-smooth[j-1].x,smooth[j].y-smooth[j-1].y);distances.push(len);}
  out.push({pts:smooth,len,distances,closed:true,start:null,end:null,label:first.label});
 }
 return out;
}
function overlaps(a,b){for(const poly of [a,b])for(let j=0;j<4;j++){const p=poly[j],q=poly[(j+1)%4],nx=-(q.y-p.y),ny=q.x-p.x;const aa=a.map(v=>v.x*nx+v.y*ny),bb=b.map(v=>v.x*nx+v.y*ny);if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=1e-6)return false;}return true;}
function fits(m,ctx,others,skip=-1){
 const poly=corners(m,ctx.length,ctx.width),inMask=p=>{const x=Math.floor(p.x/ctx.sx),y=Math.floor(p.y/ctx.sy);return x>=0&&x<ctx.w&&y>=0&&y<ctx.h&&ctx.mask[y*ctx.w+x]&&(!ctx.edge||!ctx.distance||ctx.distance[y*ctx.w+x]>=ctx.edge+Math.hypot(ctx.sx,ctx.sy)/2);};
 // Sample the face, not only corners: a rectangle must also avoid letter counters.
 const nx=Math.min(256,Math.max(6,Math.ceil(ctx.length/Math.min(ctx.sx,ctx.sy)))),ny=Math.min(128,Math.max(2,Math.ceil(ctx.width/Math.min(ctx.sx,ctx.sy))));
 for(let x=0;x<=nx;x++)for(let y=0;y<=ny;y++){const a={x:poly[0].x+(poly[1].x-poly[0].x)*x/nx,y:poly[0].y+(poly[1].y-poly[0].y)*x/nx},b={x:poly[3].x+(poly[2].x-poly[3].x)*x/nx,y:poly[3].y+(poly[2].y-poly[3].y)*x/nx};if(!inMask({x:a.x+(b.x-a.x)*y/ny,y:a.y+(b.y-a.y)*y/ny}))return false;}
 const radius=Math.hypot(ctx.length,ctx.width)+Math.max(ctx.gap,ctx.rowGap||0);
 for(let i=0;i<others.length;i++){if(i===skip)continue;const o=others[i];if(Math.hypot(o.x-m.x,o.y-m.y)>radius)continue;const other=corners(o,ctx.length,ctx.width),dist=polygonDistance(poly,other),angle=m.angle*Math.PI/180,perp=Math.abs(-(o.x-m.x)*Math.sin(angle)+(o.y-m.y)*Math.cos(angle)),required=ctx.mode==='fill'&&perp>ctx.width/2?(ctx.rowGap??ctx.gap):ctx.gap;if(dist<required-.05)return false;if(dist<.001&&overlaps(poly,other))return false;}
 return true;
}
function distribute(input){
 const {mask,w,h,sx,sy,length,width,gap}=input;if(!(length>0&&width>0&&gap>=0))throw Error('Dimensões inválidas.');
 const comp=components(mask,w,h);if(comp.groups.length>500)throw Error('SVG muito fragmentado. Simplifique as curvas antes de importar.');
 const mode=input.mode||'central',distance=distanceField(mask,w,h,sx,sy),parts=mode==='central'?chains(thin(mask,w,h),w,h,sx,sy,comp.groups,comp.labels):comp.groups.map(g=>({...g,edges:[]})),ctx={...input,distance},modules=[];
 const groups=parts.filter(p=>p.area>=3).sort((a,b)=>a.minX-b.minX||a.minY-b.minY);
 // Group detached dots over a stem. Holes stay part of the same connected shape.
 let next=0;for(const g of groups){const stem=groups.find(o=>o!==g&&o.minY>g.maxY&&Math.min(o.maxX,g.maxX)>Math.max(o.minX,g.minX)&&o.maxY-o.minY>(g.maxY-g.minY)*1.6&&o.minY-g.maxY<(g.maxY-g.minY)*2);g.parent=stem||g;}
 for(const g of groups)if(g.parent===g)g.group=next++;
 for(const g of groups){let parent=g;while(parent.parent!==parent)parent=parent.parent;g.group=parent.group;}
 const groupMap=new Int32Array(mask.length);for(let i=0;i<mask.length;i++){const label=comp.labels[i],group=label?parts[label-1].group:undefined;groupMap[i]=group===undefined?0:group+1;}
 if(mode==='border'){for(const e of contours(mask,w,h,sx,sy,comp.labels,distance,(input.edge||0)+width/2+Math.max(sx,sy))){const part=parts[e.label-1];part.edges.push(e);}}
 const pitch=length+gap;
 if(mode==='fill'){const angle=input.orientation===90?90:0,stepX=angle?width+(input.rowGap??gap):length+gap,stepY=angle?length+gap:width+(input.rowGap??gap);if(stepX<=0||stepY<=0)throw Error('O espaçamento precisa ser positivo.');let candidates=0;for(let y=(angle?length:width)/2;y<input.heightMM;y+=stepY)for(let x=(angle?width:length)/2;x<input.widthMM;x+=stepX){if(++candidates>200000)throw Error('Módulos muito pequenos para o tamanho do letreiro.');const ix=Math.floor(x/sx),iy=Math.floor(y/sy),group=groupMap[iy*w+ix]-1;if(group<0)continue;const m={x,y,angle,group};if(fits(m,ctx,modules))modules.push(m);}}
 for(const g of mode==='fill'?[]:groups){
  const local=[];const add=original=>{let m={...original};m.group=g.group;if(mode==='border'&&!fits(m,ctx,[])){const ix=Math.max(1,Math.min(w-2,Math.floor(m.x/sx))),iy=Math.max(1,Math.min(h-2,Math.floor(m.y/sy))),i=iy*w+ix,gx=(distance[i+1]-distance[i-1])/sx,gy=(distance[i+w]-distance[i-w])/sy,norm=Math.hypot(gx,gy);if(norm){for(let shift=1;shift<=length/3;shift+=Math.max(1,Math.min(sx,sy)/2)){m={...original,x:original.x+gx/norm*shift,y:original.y+gy/norm*shift,group:g.group};if(fits(m,ctx,[]))break;}}}if(fits(m,ctx,modules)){modules.push(m);local.push(m);return true;}return false;};
  const edges=g.edges.sort((a,b)=>b.len-a.len),anchors=new Map;
  for(const e of edges){if(e.start!==null&&!anchors.has(e.start))anchors.set(e.start,sample(e,0));if(e.end!==null&&!anchors.has(e.end))anchors.set(e.end,sample(e,e.len));}
  for(const m of anchors.values())add(m);
  for(const e of edges){
   const anchored=e.start!==null||e.end!==null;
   if(e.end!==null&&e.start===null){e.pts.reverse();e.distances=e.distances.map(d=>e.len-d).reverse();}
   let d=anchored?pitch:0;
   if(e.closed){let at=0;while(at<e.len){if(add(sample(e,at)))at+=pitch;else at+=Math.max(1,Math.min(sx,sy));}continue;}
   // Move a candidate forward when curves or junctions require more clearance.
   while(d<=e.len+.01){if(add(sample(e,Math.min(d,e.len))))d+=pitch;else d+=Math.max(1,Math.min(sx,sy));}
  }
  if(!local.length&&mode==='central'){const center={x:(g.sumX/g.area+.5)*sx,y:(g.sumY/g.area+.5)*sy,angle:0};if(!add(center))add({...center,angle:90});}
 }
 const summary=Array.from({length:next},(_,id)=>({id,name:'Elemento '+String(id+1).padStart(2,'0'),count:modules.filter(m=>m.group===id).length}));
 return{modules,groups:summary,distance,groupMap,unplaced:summary.filter(g=>!g.count).length};
}
const api={thin,components,distribute,corners,polygonDistance,fits,distanceField};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LedEngine=api;
})(typeof self!=='undefined'?self:globalThis);
