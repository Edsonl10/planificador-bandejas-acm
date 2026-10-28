const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(id=''){this.id=id;this.value='';this.textContent='';this.disabled=false;this.children=[];this.attributes={};this.listeners={};this.classList={toggle(){},contains(){return false}};}
 setAttribute(k,v){this.attributes[k]=String(v);}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 cloneNode(){return new Element(this.id);}
 addEventListener(name,callback){this.listeners[name]=callback;}
 querySelector(){return {createSVGPoint:()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y}}}),getScreenCTM:()=>({inverse:()=>({})})};}
 getContext(){return {drawImage(){},getImageData:(_x,_y,w,h)=>{const data=new Uint8ClampedArray(w*h*4);for(let i=3;i<data.length;i+=4)data[i]=255;return {data}}};}
}
const values={project:'Letreiro LED',ledType:'module',mode:'central',orientation:'0',artWidth:'200',artHeight:'200',length:'6.5',width:'1',gap:'3',cutStep:'5',edge:'1',rowGap:'3',reserve:'10',rotation:'0'};
const ids=['project','ledType','mode','orientation','artWidth','artHeight','length','width','gap','cutStep','edge','rowGap','reserve','rotation','status','file','example','generate','view','drawingTitle','total','withReserve','shapeCount','groups','delete','clearSelection','svgExport','pngExport','print','cutField','lengthField','rowField','orientationField','widthCaption','gapCaption','totalLabel','reserveLabel','groupUnit','modeHelp','pitch','gapLabel'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));for(const [id,value] of Object.entries(values))elements[id].value=value;
const document={getElementById:id=>elements[id],createElement:()=>new Element(),createElementNS:()=>new Element(),querySelectorAll:selector=>selector==='.export'?[elements.svgExport,elements.pngExport,elements.print]:[]};
class FakeImage{set src(_value){queueMicrotask(()=>this.onload());}}
class FakeWorker{postMessage(ctx){const groupMap=new Int32Array(ctx.w*ctx.h);for(let y=0;y<ctx.h;y++)for(let x=0;x<ctx.w;x++)groupMap[y*ctx.w+x]=x<ctx.w/2?1:2;queueMicrotask(()=>this.onmessage({data:{distance:new Float32Array(1),groupMap,modules:[{x:50,y:50,angle:0,group:0},{x:150,y:50,angle:0,group:0}],groups:[{id:0,name:'Elemento 01'},{id:1,name:'Elemento 02'}],unplaced:1}}));}terminate(){}}
const context={document,LedSvg:{parse:()=>({node:new Element('svg'),ratio:2,widthMM:2000})},LedEngine:{fits:()=>true},Image:FakeImage,Worker:FakeWorker,Blob,URL:{createObjectURL:()=>'blob:test',revokeObjectURL(){}},XMLSerializer:class{serializeToString(){return '<svg/>'}},window:{},setTimeout,console};
vm.runInNewContext(fs.readFileSync('outputs/led.js','utf8'),context);

(async()=>{
 elements.example.onclick();
 await elements.generate.onclick();
 assert.equal(elements.total.textContent,2);
 assert.equal(elements.withReserve.textContent,3);
 assert.equal(elements.svgExport.disabled,false);
 elements.view.listeners.dblclick({clientX:1500,clientY:500,target:{closest:()=>null}});
 assert.equal(elements.total.textContent,3);
 assert.equal(elements.groups.children[1].children[1].textContent,1,'manual LED belongs to the clicked letter even if that letter had no LEDs');
 elements.reserve.value='-50';elements.reserve.oninput();
 assert.match(elements.status.textContent,/reserva entre 0 e 100%/i);
 assert.equal(elements.svgExport.disabled,true,'invalid reserve blocks exporting');
 assert.equal(elements.withReserve.textContent,'—');
 elements.reserve.value='10';elements.reserve.oninput();
 assert.equal(elements.withReserve.textContent,4);
 assert.equal(elements.svgExport.disabled,false);
 elements.gap.value='';elements.gap.oninput();
 await elements.generate.onclick();
 assert.match(elements.status.textContent,/vão livre/i,'an empty gap is not silently interpreted as zero');
 assert.equal(elements.svgExport.disabled,true,'outdated layout stays unavailable');
 elements.gap.value='3';elements.gap.oninput();
 elements.width.value='101';elements.width.oninput();
 await elements.generate.onclick();
 assert.match(elements.status.textContent,/largura do módulo/i,'declared maximum is enforced');
 console.log('PASS: LED form validation, reserve and stale export protection');
})().catch(error=>{console.error(error);process.exitCode=1});
