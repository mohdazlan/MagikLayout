const { chromium } = require('/Users/macintosh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page = await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:5180/swing-ar.html',{waitUntil:'networkidle',timeout:60000});
 await page.locator('#scene-loading').waitFor({state:'hidden',timeout:30000});
 await page.waitForTimeout(1500);
 await page.screenshot({path:'tmp/swing-ar-qa/desktop.png',fullPage:true});
 console.log(JSON.stringify({title:await page.title(),editor:await page.locator('#editor-status').innerText(),scene:await page.frames()[1].locator('a-scene').count(),errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
