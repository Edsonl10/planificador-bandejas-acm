'use strict';
importScripts('led-engine.js?v=20261028-2');
self.onmessage=event=>{try{self.postMessage(LedEngine.distribute(event.data));}catch(error){self.postMessage({error:error.message||'Falha na distribuição.'});}};
