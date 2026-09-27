const { chromium } = require('/Users/macintosh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5180/#/ar-lab');
  if (await page.getByText('Swing Discovery Lab',{exact:true}).count()) throw Error('Old entry remains');
  await page.getByRole('button',{name:'Begin repair exercise'}).click();
  await page.getByRole('button',{name:'Watch the bug'}).click({timeout:45000});
  await page.getByRole('button',{name:'Add JPanel'}).click({timeout:15000});
  await page.getByRole('combobox').selectOption('flow');
  await page.getByRole('button',{name:'Set panel layout'}).click();
  for (const name of ['Submit','Cancel']) {
    await page.getByRole('button',{name,exact:true}).click();
    await page.getByRole('button',{name:'Place selected button in JPanel'}).click();
  }
  await page.getByRole('button',{name:'Select JPanel',exact:true}).click();
  await page.getByRole('button',{name:'Place in SOUTH',exact:true}).click();
  await page.getByRole('button',{name:'The panel widens; buttons stay centred'}).click();
  await page.getByRole('slider').fill('640');
  await page.getByText('Java evidence · repaired structure').click();
  if (!(await page.locator('pre').innerText()).includes('frame.add(panel1, BorderLayout.SOUTH)')) throw Error('Missing repair evidence');
  if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile overflow');
  await page.screenshot({path:'tmp/swing-ar-qa/repair-mobile.png',fullPage:true});
  console.log(JSON.stringify({completed:true,errors}));
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
