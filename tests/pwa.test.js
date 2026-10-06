import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const sourceRoot=new URL('../src/',import.meta.url);
test('manifest supports root and GitHub Pages subpaths with valid platform icons',async()=>{
  const manifest=JSON.parse(await fs.readFile(new URL('manifest.webmanifest',sourceRoot),'utf8'));
  assert.equal(manifest.display,'standalone');assert.equal(manifest.prefer_related_applications,false);
  for(const folder of ['/','/hebrew-date/']) {
    const url=new URL('manifest.webmanifest','https://example.github.io'+folder);
    for(const key of ['id','start_url','scope'])assert.equal(new URL(manifest[key],url).pathname,folder);
  }
  for(const icon of manifest.icons){
    const png=await fs.readFile(new URL(icon.src,sourceRoot));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,icon.sizes);
  }
  assert.ok(manifest.icons.some(i=>i.sizes==='192x192'&&i.purpose==='any'));
  assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'));
  const apple=await fs.readFile(new URL('icons/apple-touch-icon.png',sourceRoot));assert.equal(apple.readUInt32BE(16),180);
  const html=await fs.readFile(new URL('index.html',sourceRoot),'utf8');assert.match(html,/rel="apple-touch-icon"/);assert.match(html,/rel="manifest"/);
});
async function worker(scope='/app/'){
  const handlers={},stored=new Map(),deleted=[],precached=[];
  const context=vm.createContext({URL,self:{location:{href:'https://example.github.io'+scope+'sw.js'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{
    open:async name=>({addAll:async paths=>{precached.push(...paths);for(const path of paths)stored.set(name+'|'+path,{body:'cached '+path});}}),
    match:async(request,{cacheName})=>stored.get(cacheName+'|'+(typeof request==='string'?request:request.url)),
    keys:async()=>['hebrew-date-/app/-old','hebrew-date-/sibling/-old','other-app'],
    delete:async key=>{deleted.push(key);return true;}
  },fetch:async()=>{throw Error('offline');}});
  vm.runInContext(await fs.readFile(new URL('sw.js',sourceRoot),'utf8'),context);
  let install;handlers.install({waitUntil:p=>install=p});await install;
  return {handlers,stored,deleted,precached};
}
test('offline app shell is complete and relative to the service worker scope',async()=>{
  const w=await worker();assert.equal(w.precached.length,10);
  for(const url of w.precached){assert.ok(url.startsWith('https://example.github.io/app/'));await fs.access(new URL(url.replace('https://example.github.io/app/',''),sourceRoot));}
  let response;w.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://example.github.io/app/?launch=home'},respondWith:p=>response=p});
  assert.equal((await response).body,'cached https://example.github.io/app/index.html');
  response=undefined;w.handlers.fetch({request:{method:'GET',mode:'cors',url:'https://example.github.io/app/app.js'},respondWith:p=>response=p});
  assert.equal((await response).body,'cached https://example.github.io/app/app.js');
});
test('root offline worker lets other GitHub Pages projects load normally',async()=>{
  const w=await worker('/');
  for(const path of ['/rpc-print-estimator/','/rpc-print-estimator/index.html','/unknown/']){
    let responded=false;
    w.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://example.github.io'+path},respondWith:()=>responded=true});
    assert.equal(responded,false);
  }
  let response;
  w.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://example.github.io/?launch=home'},respondWith:p=>response=p});
  assert.equal((await response).body,'cached https://example.github.io/index.html');
});
test('cache cleanup preserves sibling apps and unrelated requests bypass the worker',async()=>{
  const w=await worker();let activation;w.handlers.activate({waitUntil:p=>activation=p});await activation;
  assert.deepEqual(w.deleted,['hebrew-date-/app/-old']);
  for(const request of [{method:'POST',url:'https://example.github.io/app/'},{method:'GET',url:'https://other.example/image.png'},{method:'GET',url:'https://example.github.io/another/'},{method:'GET',url:'https://example.github.io/app/source.zip'}]) {
    let responded=false;w.handlers.fetch({request,respondWith:()=>responded=true});assert.equal(responded,false);
  }
});
