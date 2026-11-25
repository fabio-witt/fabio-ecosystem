const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('failed navigation cannot replace the working offline shell',async()=>{
 const handlers={};let writes=0;
 const response={ok:false,headers:{get:()=> 'text/html'},clone:()=>({})};
 vm.runInNewContext(fs.readFileSync('grammarfirst/lingora/sw.js','utf8'),{
  self:{location:{origin:'https://example.org'},addEventListener:(name,fn)=>handlers[name]=fn},URL,
  fetch:async()=>response,caches:{open:async()=>({put:()=>writes++})}
 });
 let result;handlers.fetch({request:{url:'https://example.org/grammarfirst/lingora/',method:'GET',mode:'navigate'},respondWith:p=>result=p,waitUntil:()=>{}});
 assert.equal(await result,response);assert.equal(writes,0);
});
test('subscription database failures return 500 so Stripe retries',async()=>{
 let source=fs.readFileSync('sprachlernapp/supabase/functions/stripe-webhook/index.ts','utf8')
 .replace(/^import .*;$/gm,'').replace(/let event:Stripe.Event;/,'let event;')
 .replace(/sub:Stripe.Subscription/g,'sub').replace(/ as Stripe.Subscription/g,'').replace(/\)!/g,')');
 let handler;
 class Stripe {static createSubtleCryptoProvider(){};webhooks={constructEventAsync:async()=>({id:'evt_test',type:'customer.subscription.updated',data:{object:{id:'sub_test',metadata:{supabase_user_id:'user_test'},status:'active',customer:'cus_test',current_period_end:1800000000}}})}}
 vm.runInNewContext(source,{Stripe,createClient:()=>({from:()=>({upsert:async()=>({error:new Error('database unavailable')})})}),Deno:{env:{get:()=> 'test'},serve:fn=>handler=fn},Response,console:{error:()=>{}}});
 const result=await handler(new Request('https://example.org',{method:'POST',body:'test'}));
 assert.equal(result.status,500);
});
