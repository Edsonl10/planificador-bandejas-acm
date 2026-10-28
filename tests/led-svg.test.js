const assert=require('node:assert/strict');
const LedSvg=require('../outputs/led-svg.js');

class Element{
 constructor(localName,attributes={},children=[],textContent=''){this.localName=localName;this.attributes={...attributes};this.children=children;this.textContent=textContent;}
 getAttribute(name){return Object.hasOwn(this.attributes,name)?this.attributes[name]:null;}
 setAttribute(name,value){this.attributes[name]=String(value);}
 append(node){this.children.push(node);}
}
global.document={createElementNS:(_ns,name)=>new Element(name)};
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
