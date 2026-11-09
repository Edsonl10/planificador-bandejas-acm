const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('outputs/planificador-bandejas-acm.html','utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const values={project:'Orçamento ACM',sheetMode:'auto',sheet:'1220x5000',metalon:'20',flange:'2.5',rear:'2.5',pagination:'horizontal'};
const ids=['project','sheetMode','sheet','metalon','flange','rear','pagination','pieces','add','calculate','repage','report'];
const elements=Object.fromEntries(ids.map(id=>[id,{value:values[id]||'',innerHTML:'',options:[{},{}],querySelectorAll:()=>[]}]));
const document={querySelector:selector=>elements[selector.slice(1)],createTreeWalker:()=>({nextNode:()=>null})};
const context={document,window:{},NodeFilter:{SHOW_TEXT:4},console,Date,Math,Number,Array,Map};
vm.createContext(context);vm.runInContext(script,context);
assert.match(elements.report.innerHTML,/Ficha de produção/);
elements.flange.value='-1';elements.flange.oninput();
assert.match(elements.report.innerHTML,/aba lateral igual ou maior que zero/i);
assert.doesNotMatch(elements.report.innerHTML,/Ficha de produção/);
elements.flange.value='2.5';elements.flange.oninput();
assert.match(elements.report.innerHTML,/Ficha de produção/);
vm.runInContext('pieces[0].w=0.5',context);elements.calculate.onclick();
assert.match(elements.report.innerHTML,/largura e altura maiores que 1 cm/i);
vm.runInContext('pieces[0].w=200;pieces[0].qty=1.5',context);elements.calculate.onclick();
assert.match(elements.report.innerHTML,/quantidade inteira/i);
console.log('PASS: ACM rejects invalid flanges, frame dimensions and quantities');

elements.sheetMode.value='manual';
elements.pagination.value='vertical';
vm.runInContext('Object.assign(pieces[0],{w:955,h:170,qty:1})',context);

for(const {sheet,modules,vertical} of [
  {sheet:'1500x5000',modules:7,vertical:6},
  {sheet:'1220x5000',modules:9,vertical:7},
]){
  elements.sheet.value=sheet;
  elements.calculate.onclick();
  assert.match(elements.report.innerHTML,new RegExp(`Dividida em ${modules} módulos`));
  const frame=elements.report.innerHTML.match(/Quadro de metalon = 954x169cm<\/h3><svg[^>]*>(.*?)<\/svg>/s)[1];
  const bars=[...frame.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)" class="bar"/g)];
  assert.equal(bars.filter(([,x1,,x2])=>x1===x2).length,vertical,sheet);
  assert.equal(bars.filter(([,,y1,,y2])=>y1===y2).length,1,sheet);
  assert.match(frame,new RegExp(`Metalon 20 mm · ${vertical+1} travessa\\(s\\)`));
}

assert.equal(vm.runInContext(`(()=>{
  const panel=pieces[0],frameWidth=panel.w-1;
  const {widths}=modulePlan(panel,2.5,2.5,{w:150,h:500});
  const points=panelPoints(widths);
  const seams=points.slice(1,-1).map(x=>x/panel.w*frameWidth);
  const centers=widths.map((width,i)=>(points[i]+width/2)/panel.w*frameWidth).slice(1,-1);
  const bars=safeTraverses(frameWidth,seams,centers);
  return largestGap(frameWidth,bars)<=150 && bars.every(bar=>seams.every(seam=>Math.abs(bar-seam)>=5));
})()`,context),true);
assert.equal(vm.runInContext('JSON.stringify(safeTraverses(300,[150]))',context),'[100,200]');
console.log('PASS: ACM distributes both axes with 1.50 m and 1.22 m sheets and avoids seams');
