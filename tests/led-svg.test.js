const assert=require('node:assert/strict');
const LedSvg=require('../outputs/led-svg.js');

class Element{
 constructor(localName,attributes={},children=[],textContent=''){this.localName=localName;this.attributes={...attributes};this.children=[];this.parentElement=null;this.style={};this.textContent=textContent;for(const child of children)this.append(child);}
 getAttribute(name){return Object.hasOwn(this.attributes,name)?this.attributes[name]:null;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 append(node){node.parentElement=this;this.children.push(node);}
 remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null;}}
 querySelectorAll(selector){const names=selector.split(',');let found=[];for(const child of this.children){if(names.includes(child.localName))found.push(child);found.push(...child.querySelectorAll(selector));}return found;}
 closest(selector){const names=selector.split(',');for(let node=this;node;node=node.parentElement)if(names.includes(node.localName))return node;return null;}
}
global.document={createElementNS:(_ns,name)=>new Element(name),createElement:name=>new Element(name),body:new Element('body')};
const style=new Element('style',{},[],'.fil0{fill:none;stroke:#000;stroke-width:2}.fil1{fill:#fff;fill-rule:evenodd}.hidden{display:none}@import url(https://invalid.test/x);');
const defs=new Element('defs',{},[new Element('clipPath',{id:'cut'},[new Element('rect',{x:'0',y:'0',width:'80',height:'40'})])]);
const outer=new Element('path',{class:'fil1',d:'M0 0H100V50H0Z',onclick:'alert(1)','clip-path':'url(#cut)'});
const outline=new Element('rect',{class:'fil0',x:'1',y:'1',width:'20',height:'20',style:'fill:none;stroke:red;stroke-width:2'});
const script=new Element('script',{},[],'alert(1)');
const root=new Element('svg',{width:'100mm',height:'50mm',viewBox:'0 0 100 50'},[style,defs,outer,outline,script]);
const doc={documentElement:root,querySelector:()=>null,querySelectorAll:name=>name==='style'?[style]:[]};
const result=LedSvg.sanitizeDocument(doc);
assert.equal(result.ratio,2);
assert.equal(result.widthMM,100);
assert.equal(result.node.getAttribute('fill-rule'),'nonzero','SVG default winding must be respected');
const css=result.node.children.find(x=>x.localName==='style').textContent;
assert.match(css,/#led-svg-artwork \.fil0\{fill:none;stroke:#263540;stroke-width:2\}/);
assert.match(css,/#led-svg-artwork \.fil1\{fill:#263540;fill-rule:evenodd\}/);
assert.match(css,/#led-svg-artwork \.hidden\{display:none\}/);
assert.doesNotMatch(css,/https:|@import/);
assert.equal(result.node.children.some(x=>x.localName==='script'),false);
const cleanPath=result.node.children.find(x=>x.localName==='path');
assert.equal(cleanPath.getAttribute('class'),'fil1');
assert.equal(cleanPath.getAttribute('clip-path'),'url(#cut)');
assert.equal(cleanPath.getAttribute('onclick'),null);
const cleanOutline=result.node.children.find(x=>x.localName==='rect');
assert.equal(cleanOutline.getAttribute('style'),'fill:none;stroke:#263540;stroke-width:2');
assert.equal(result.node.children.find(x=>x.localName==='defs').children[0].getAttribute('id'),'cut');
assert.equal(LedSvg.declarations('fill:url(https://invalid.test/x);clip-path:url(https://invalid.test/x);opacity:0'), 'fill:#263540;opacity:0');
assert.doesNotMatch(LedSvg.stylesheet('path{background:url(https://invalid.test/x);stroke:url(https://invalid.test/x)}'),/https:/);
console.log('PASS: Corel CSS, strokes, clipping, SVG winding and safe import');

const defaults={display:'inline',visibility:'visible',opacity:'1',fill:'#263540',fillOpacity:'1',stroke:'none',strokeOpacity:'1',strokeWidth:'1px'};
global.getComputedStyle=node=>({...defaults,...node.computed});
const closed=new Element('path',{d:'M0 0H100V40H0Z M20 10H30V20H20Z',style:'stroke-width:2'});
closed.computed={fill:'none',stroke:'#263540'};
const open=new Element('path',{d:'M0 0L50 50'});open.computed={fill:'none',stroke:'#263540'};
const hidden=new Element('path',{d:'M0 0H20V20Z'});hidden.computed={fill:'none',stroke:'#263540',display:'none'};
const style2=new Element('style',{},[],'#led-svg-artwork .fil0{fill:none}');
const outlinedSvg=new Element('svg',{id:'led-svg-artwork'},[style2,closed,open,hidden]);
assert.equal(LedSvg.fillOutlinedShapes(outlinedSvg),1,'closed stroke-only paths form usable areas');
assert.equal(closed.getAttribute('style'),'stroke-width:2;fill:#263540;fill-opacity:1');
assert.equal(open.getAttribute('style'),null,'open paths are not filled');
assert.equal(hidden.getAttribute('style'),null,'hidden shapes are not converted');
assert.equal(outlinedSvg.getAttribute('id'),'led-svg-artwork');
assert.equal(style2.textContent,'#led-svg-artwork .fil0{fill:none}');
assert.equal(global.document.body.children.length,0,'inspection does not leave artwork in the page');
const filled=new Element('rect',{width:'10',height:'10'});filled.computed={fill:'#263540'};
const decorative=new Element('rect',{width:'5',height:'5'});decorative.computed={fill:'none',stroke:'#263540'};
assert.equal(LedSvg.fillOutlinedShapes(new Element('svg',{id:'led-svg-artwork'},[filled,decorative])),0,'mixed filled artwork keeps its unfilled outlines');
assert.equal(decorative.getAttribute('style'),null);
assert.equal(LedSvg.closedShape(new Element('path',{d:'M0 0L1 1 M2 2Z'})),false);
console.log('PASS: closed outline-only lettering becomes filled, while open and decorative outlines are preserved');
