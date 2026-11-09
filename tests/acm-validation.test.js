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

for(const {sheet,modules,gaps} of [
  {sheet:'1500x5000',modules:7,gaps:[87,100,145,145,145,145,100,87]},
  {sheet:'1220x5000',modules:9,gaps:[126,117,117,117,117,117,117,126]},
]){
  elements.sheet.value=sheet;
  elements.calculate.onclick();
  assert.match(elements.report.innerHTML,new RegExp(`Dividida em ${modules} módulos`));
  const frame=elements.report.innerHTML.match(/Quadro de metalon = 954x169cm<\/h3><svg[^>]*>(.*?)<\/svg>/s)[1];
  const bars=[...frame.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)" class="bar"/g)];
  assert.equal(bars.filter(([,x1,,x2])=>x1===x2).length,gaps.length-1,sheet);
  assert.equal(bars.filter(([,,y1,,y2])=>y1===y2).length,1,sheet);
  const dimensions=[...frame.matchAll(/class="qtext">([^<]+)cm<\/text>/g)].map(([,value])=>Number(value.replace(',','.')));
  assert.deepEqual(dimensions.slice(0,-2),gaps,sheet);
  assert.match(frame,/Metalon 20 mm · 8 travessa\(s\)/);
}

for(const profile of [2,3]){
  const [position]=vm.runInContext(`safeTraverses(169,[84.5],[84.5],${profile})`,context);
  assert.equal(Math.abs(position-84.5)-profile/2,5);
}
assert.equal(vm.runInContext('JSON.stringify(safeTraverses(300,[150]))',context),'[100,200]');
assert.equal(vm.runInContext('safeTraverses(400,Array.from({length:51},(_,i)=>100+i*4))',context),null);
console.log('PASS: ACM centers traverses in both sheet sizes and measures seam clearance from the profile edge');
