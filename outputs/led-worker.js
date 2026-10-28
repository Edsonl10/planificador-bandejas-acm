'use strict';
importScripts('led-engine.js?v=20261028-1');
self.onmessage=event=>{try{self.postMessage(LedEngine.distribute(event.data));}catch(error){self.postMessage({error:error.message||'Falha na distribuição.'});}};
