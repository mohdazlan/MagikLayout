const { chromium } = require('/Users/macintosh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-video-capture=/tmp/magiklayout-hiro-camera.y4m']});
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:5180/#/ar-lab');
 await page.getByRole('heading',{name:'Swing Discovery Lab',exact:true}).waitFor();
 assert(await page.getByRole('heading',{name:'BorderLayout AR Prototype Lab'}).count());
 const first=await page.locator('.ar-intro-main').boundingBox();const second=await page.locator('.ar-discovery-intro').boundingBox();assert(second.y>first.y+first.height-1);
 await page.screenshot({path:'tmp/swing-ar-qa/ar-labs.png',fullPage:true});
 await page.getByRole('link',{name:'Open Swing Discovery Lab'}).click();
 await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});
 await page.locator('#editor-status').filter({hasText:'Monaco'}).waitFor();
 for(let i=0;i<5;i++){
  assert((await page.locator('#scene-label').innerText()).includes(['JButton','JTextField','JPanel','JFrame','JLabel'][i]));
  await page.waitForTimeout(200);
  fs.mkdirSync(`tmp/swing-ar-qa/java/component-${i}`,{recursive:true});fs.writeFileSync(`tmp/swing-ar-qa/java/component-${i}/MyApp.java`,await page.locator('#code-fallback').textContent());
  await page.locator('#next-component').click();
 }
 await page.getByRole('button',{name:'Place in JFrame',exact:true}).click();
 assert((await page.locator('#code-fallback').textContent()).includes('frame.add(button1)'));
 await page.locator('[data-lesson="layouts"]').click();assert(await page.locator('#code-cover').isVisible());
 await page.locator('[data-layout="border"]').click();await page.locator('[data-layout="flow"]').click();
 await page.locator('#width').fill('260');assert((await page.locator('#code-fallback').textContent()).includes('setSize(260, 300)'));
 await page.locator('[data-lesson="build"]').click();await page.locator('[data-action="check"]').click();assert((await page.locator('#feedback').innerText()).includes('Missing'));
 for(const [index,region] of [[4,'NORTH'],[1,'CENTER'],[0,'SOUTH']]){
   await page.locator(`[data-component="${index}"]`).click();await page.locator('#region').selectOption(region);await page.locator('[data-action="place"]').click();
 }
 await page.locator('[data-action="check"]').click();assert((await page.locator('#feedback').innerText()).includes('You built it!'));assert(!(await page.locator('#code-cover').isVisible()));
 await page.screenshot({path:'tmp/swing-ar-qa/build.png',fullPage:true});
 fs.mkdirSync('tmp/swing-ar-qa/java/build',{recursive:true});fs.writeFileSync('tmp/swing-ar-qa/java/build/MyApp.java',await page.locator('#code-fallback').textContent());
 await page.locator('[data-lesson="debug"]').click();assert(await page.locator('[data-action="repair"]').isDisabled());
 await page.locator('[data-action="inspect"]').click();await page.locator('[data-action="repair"]').click();assert((await page.locator('#feedback').innerText()).includes('Fixed'));
 fs.mkdirSync('tmp/swing-ar-qa/java/debug',{recursive:true});fs.writeFileSync('tmp/swing-ar-qa/java/debug/MyApp.java',await page.locator('#code-fallback').textContent());
 await page.locator('[data-lesson="events"]').click();await page.locator('[data-action="tap"]').click();assert((await page.locator('#feedback').innerText()).includes('Nothing is listening'));
 await page.locator('[data-action="listener"]').click();await page.locator('[data-action="tap"]').click();assert((await page.locator('#feedback').innerText()).includes('label changed'));
 fs.mkdirSync('tmp/swing-ar-qa/java/events',{recursive:true});fs.writeFileSync('tmp/swing-ar-qa/java/events/MyApp.java',await page.locator('#code-fallback').textContent());
 await page.screenshot({path:'tmp/swing-ar-qa/events.png',fullPage:true});
 await page.locator('[data-lesson="recognition"]').click();await page.locator('[data-component="0"]').click();
 await page.locator('#camera-toggle').click();
 await page.locator('#mode-status').filter({hasText:'Hiro found'}).waitFor({timeout:40000});
 console.log('ACTUAL AR.JS HIRO DETECTION FROM SYNTHETIC CAMERA: PASS');
 await page.screenshot({path:'tmp/swing-ar-qa/ar-marker.png',fullPage:true});
 await page.locator('#next-component').click();
 assert((await page.locator('#scene-label').innerText()).includes('JTextField'));
 const arFrame=page.frames().find(f=>f.url().includes('scene.html'));
 const streamsBefore=await arFrame.evaluate(()=>[...document.querySelectorAll('video')].flatMap(v=>v.srcObject?.getTracks().map(t=>t.readyState)||[]));assert(streamsBefore.includes('live'));
 await page.locator('#camera-toggle').click();await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});
 const previewFrame=page.frames().find(f=>f.url().includes('scene.html'));
 assert.equal(await previewFrame.locator('video').count(),0);
 console.log('CAMERA STOP / PREVIEW RESTORED: PASS');
 await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});
 await page.screenshot({path:'tmp/swing-ar-qa/mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log(JSON.stringify({progress:await page.locator('#progress-text').innerText(),mobileOverflow:false,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
