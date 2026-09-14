const { chromium }=require('/Users/macintosh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5180/swing-ar.html');
 await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});
 const scene=()=>page.frames().find(f=>f.url().includes('scene.html'));
 async function settle(){await scene().waitForFunction(()=>{const models=[...document.querySelectorAll('[gltf-model]')];return models.length>1&&models.every(e=>!!e.getObject3D('mesh'))});await page.waitForTimeout(300)}
 async function point(selector){await settle();const point=await scene().evaluate(selector=>{const el=selector.startsWith('region:')?[...document.querySelectorAll('a-plane')].find(e=>e.getObject3D('mesh')?.userData.region===selector.slice(7)):document.querySelector(selector);const scene=document.querySelector('a-scene');scene.object3D.updateMatrixWorld(true);const pos=new AFRAME.THREE.Vector3();el.object3D.getWorldPosition(pos);pos.project(scene.camera);return {x:(pos.x+1)*scene.canvas.clientWidth/2,y:(1-pos.y)*scene.canvas.clientHeight/2}},selector);const box=await page.locator('#scene').boundingBox();return {x:box.x+point.x,y:box.y+point.y}}
 const p=await point('[data-piece="specimen"]');await page.mouse.click(p.x,p.y);await page.locator('#feedback').filter({hasText:'You pressed a JButton'}).waitFor();
 await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+70,p.y,{steps:6});await page.mouse.up();await page.waitForFunction(()=>document.getElementById('rotation').value!=='-12');
 await page.locator('[data-lesson="build"]').click();
 for(const [index,region] of [[4,'NORTH'],[1,'CENTER'],[0,'SOUTH']]){
  await page.locator(`[data-component="${index}"]`).click();
  const tray=await point('[data-piece="build-tray"]');
  const end=await point(`region:${region}`);
  await page.mouse.move(tray.x,tray.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
  await page.locator('#feedback').filter({hasText:`placed in ${region}`}).waitFor();
 }
 await page.locator('[data-action="check"]').click();assert((await page.locator('#feedback').innerText()).includes('You built it!'));
 await settle();await page.screenshot({path:'tmp/swing-ar-qa/build-pointer.png',fullPage:true});
 await page.locator('[data-lesson="events"]').click();await page.locator('[data-action="listener"]').click();const btn=await point('[data-piece="event-button"]');await page.mouse.click(btn.x,btn.y);await page.locator('#feedback').filter({hasText:'label changed'}).waitFor();
 await page.locator('[data-lesson="layouts"]').click();await page.locator('#width').fill('600');await page.setViewportSize({width:375,height:812});await settle();await page.screenshot({path:'tmp/swing-ar-qa/mobile-wide-frame.png',fullPage:true});
 await page.locator('#camera-toggle').click();await page.locator('#feedback').filter({hasText:/camera.*(not allowed|could not start)/i}).waitFor({timeout:30000});await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});assert((await page.locator('#mode-status').innerText()).includes('camera off'));
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});await settle();
 const fallback=await context.newPage();await fallback.route('**/monaco-editor@*/**',r=>r.abort());await fallback.goto('http://127.0.0.1:5180/swing-ar.html');await fallback.locator('#editor-status').filter({hasText:'Monaco unavailable'}).waitFor();assert(await fallback.locator('#code-fallback').isVisible());assert((await fallback.locator('#code-fallback').innerText()).includes('JButton'));
 const failed=await context.newPage();await failed.route('**/aframe.min.js',r=>r.abort());await failed.goto('http://127.0.0.1:5180/swing-ar.html');await failed.locator('#camera-toggle').filter({hasText:'Retry 3D'}).waitFor();await failed.unroute('**/aframe.min.js');await failed.locator('#camera-toggle').click();await failed.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});
 console.log(JSON.stringify({raycastTap:true,pointerRotate:true,dragDropBuild:true,eventTap:true,cameraDenialRecovery:true,restoredPage:true,monacoFallback:true,sceneRetry:true,errors}));assert.equal(errors.length,0);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
