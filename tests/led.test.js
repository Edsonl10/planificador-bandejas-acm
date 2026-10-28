const assert=require('node:assert/strict');
const E=require('../outputs/led-engine.js');
function input(mode='central'){const w=160,h=90,mask=new Uint8Array(w*h);for(let y=5;y<85;y++)for(let x=5;x<155;x++)mask[y*w+x]=1;return{mask,w,h,sx:2,sy:2,widthMM:320,heightMM:180,length:30,width:8,gap:10,edge:6,rowGap:12,mode,orientation:0};}
for(const mode of ['central','border','fill']){
 const ctx=input(mode),r=E.distribute(ctx);assert.ok(r.modules.length>0,mode+' distributes');ctx.distance=r.distance;
 for(let i=0;i<r.modules.length;i++)assert.ok(E.fits(r.modules[i],ctx,r.modules,i),mode+' honors clearance, holes and spacing');
 if(mode==='fill')assert.ok(r.modules.length>10,'fill uses multiple rows');
}
const ring=input('border');for(let y=30;y<60;y++)for(let x=55;x<105;x++)ring.mask[y*ring.w+x]=0;
const ringResult=E.distribute(ring);assert.ok(ringResult.modules.length>5);assert.ok(ringResult.modules.some(m=>m.x>70&&m.x<240&&m.y>35&&m.y<145),'inner contours are traced');
const a=E.distribute(input('fill')),bInput=input('fill');bInput.rowGap=30;const b=E.distribute(bInput);assert.ok(a.modules.length>b.modules.length,'row gap changes quantity');
const inset=input('fill');inset.edge=40;assert.ok(E.distribute(inset).modules.length<a.modules.length,'edge distance reduces fill');
const tape=input();tape.length=25;tape.gap=0;tape.type='strip';const t=E.distribute(tape);assert.ok(t.modules.length>0);assert.ok(t.modules.length*tape.length/1000>0,'strip length in metres');
console.log('PASS: central, border, inner contours, fill, edge clearance, row gap, strip segments and collision checks');

const vertical=input('fill');vertical.orientation=90;const vr=E.distribute(vertical);vertical.distance=vr.distance;assert.ok(vr.modules.every(m=>m.angle===90));assert.ok(vr.modules.every((m,i)=>E.fits(m,vertical,vr.modules,i)),'vertical fill margins and spacing');
const narrowRows=input('fill');narrowRows.rowGap=2;assert.ok(E.distribute(narrowRows).modules.length>a.modules.length,'row clearance can be less than longitudinal gap');
const noGap=input();noGap.gap=0;const nr=E.distribute(noGap);noGap.distance=nr.distance;assert.ok(nr.modules.every((m,i)=>E.fits(m,noGap,nr.modules,i)),'zero gap still rejects overlap');
console.log('PASS: vertical rows, independent row gap and zero-gap strips');

// Alguns SVGs do Corel recortam o viewBox exatamente na borda do desenho.
const tight={w:160,h:40,sx:1,sy:1,widthMM:160,heightMM:40,length:20,width:4,gap:4,edge:2,rowGap:4,mode:'central',orientation:0};
tight.mask=new Uint8Array(tight.w*tight.h).fill(1);
const tightResult=E.distribute(tight);
assert.ok(tightResult.modules.length>=5,'a shape touching every viewBox edge still gets a central row');
tight.distance=tightResult.distance;
assert.ok(tightResult.modules.every((m,i)=>E.fits(m,tight,tightResult.modules,i)),'edge-touching shape still honors clearance');
console.log('PASS: central distribution when artwork touches the SVG boundaries');

const separate={w:140,h:50,sx:1,sy:1,widthMM:140,heightMM:50,length:30,width:4,gap:4,edge:1,rowGap:4,mode:'central',orientation:0};
separate.mask=new Uint8Array(separate.w*separate.h);
for(let y=5;y<45;y++)for(let x=5;x<90;x++)separate.mask[y*separate.w+x]=1;
for(let y=10;y<24;y++)for(let x=110;x<124;x++)separate.mask[y*separate.w+x]=1;
const separateResult=E.distribute(separate),left=separateResult.groupMap[20*separate.w+20]-1,right=separateResult.groupMap[15*separate.w+115]-1;
assert.notEqual(left,right,'each separate shape has its own group even when it has no LEDs');
assert.ok(separateResult.modules.some(m=>m.group===left));
assert.equal(separateResult.modules.some(m=>m.group===right),false);
assert.equal(separateResult.groupMap[0],0,'background is not assigned to a group');
console.log('PASS: group map identifies letters without automatically placed modules');
