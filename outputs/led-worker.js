'use strict';
importScripts('led-engine.js');
self.onmessage=event=>{try{self.postMessage(LedEngine.distribute(event.data));}catch(error){self.postMessage({error:error.message||'Falha na distribuição.'});}};
