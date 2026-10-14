const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('C:/Users/willy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const clean=(req.url.split('?')[0]==='/'?'index.html':decodeURIComponent(req.url.split('?')[0].slice(1))),file=path.join(root,clean);if(!file.startsWith(root)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)})});

function installFirebaseMock(){
  const listeners=[];
  const makeUser=(verified=true)=>({uid:'qa-user',email:'qa@example.invalid',emailVerified:verified,sendEmailVerification:async()=>{},reload:async()=>{},getIdToken:async()=>''});
  let currentUser=localStorage.getItem('edb-mock-auth')?makeUser(true):null;
  const notify=()=>listeners.forEach(listener=>listener(currentUser));
  const authApi={
    get currentUser(){return currentUser},languageCode:'pt-BR',
    setPersistence:async()=>{},
    onAuthStateChanged(listener){listeners.push(listener);queueMicrotask(()=>listener(currentUser));return()=>{}},
    async signInWithEmailAndPassword(){currentUser=makeUser(true);localStorage.setItem('edb-mock-auth','1');notify();return{user:currentUser}},
    async createUserWithEmailAndPassword(){currentUser=makeUser(false);notify();return{user:currentUser}},
    async sendPasswordResetEmail(){},
    async signOut(){currentUser=null;localStorage.removeItem('edb-mock-auth');notify()}
  };
  const auth=()=>authApi;auth.Auth={Persistence:{LOCAL:'local'}};
  const documentRef={
    async get(){return{exists:false,data:()=>null}},
    async set(){},
    onSnapshot(){return()=>{}}
  };
  const dbApi={enablePersistence:async()=>{},collection:()=>({doc:()=>({collection:()=>({doc:()=>documentRef})})})};
  const firestore=()=>dbApi;firestore.FieldValue={serverTimestamp:()=>({mock:true})};
  window.firebase={initializeApp(){},auth,firestore};
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
  await context.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
  const page=await context.newPage(),errors=[];
  await page.addInitScript(installFirebaseMock);
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  try{
    await page.goto(url,{waitUntil:'networkidle'});
    assert.equal(await page.title(),'Elétrica de Bolso 0.8');
    assert(await page.locator('#authGate:not([hidden])').isVisible(),'tela de login não apareceu');
    await page.fill('#authEmail','qa@example.invalid');
    await page.fill('#authPassword','senha-segura');
    await page.locator('#loginForm button[type=submit]').click();
    await page.locator('#inicio.active').waitFor({state:'visible'});
    assert((await page.locator('#syncStatus').innerText()).match(/Sincronizado|Carregando/));

    await page.click('[data-view=cadastros]');
    await page.click('#newClient');
    assert(await page.locator('#modal:not([hidden])').isVisible());
    assert.equal(await page.locator('#modal input[name=name]').evaluate(element=>document.activeElement===element),true);
    await page.fill('#modal input[name=name]','Cliente QA');
    await page.locator('#modalForm button[type=submit]').click();
    await page.click('[data-new-property]');
    await page.fill('#modal input[name=name]','Obra QA');
    await page.locator('#modalForm button[type=submit]').click();
    await page.click('[data-new-project]');
    await page.fill('#modal input[name=name]','Projeto QA');
    await page.locator('#modalForm button[type=submit]').click();
    assert((await page.locator('#clientDetail').innerText()).includes('Projeto QA'));

    await page.click('[data-view=planta]');
    assert(await page.locator('#planWorkspace').isVisible());
    await page.click('#newRoom');
    await page.fill('#modal input[name=name]','Sala');
    await page.locator('#modalForm button[type=submit]').click();
    assert.equal(await page.locator('.room').count(),1);
    await page.click('[data-tool=tug]');
    const box=await page.locator('#planBoard').boundingBox();
    await page.mouse.click(box.x+100,box.y+100);
    assert.equal(await page.locator('.point[data-type=tug]').count(),1);

    await page.click('[data-view=dimensionamento]');
    await page.click('#autoCircuits');
    assert((await page.locator('#circuitTable tr').count())>=1);
    assert((await page.locator('#boardChecklist').innerText()).includes('Não faça ponte neutro–terra'));
    await page.click('[data-view=manutencoes]');
    await page.click('#newMaintenance');
    await page.fill('#modal textarea[name=description]','Inspeção de teste');
    await page.locator('#modalForm button[type=submit]').click();
    assert((await page.locator('#maintenanceList').innerText()).includes('Inspeção de teste'));

    await page.reload({waitUntil:'networkidle'});
    await page.locator('#inicio.active').waitFor({state:'visible'});
    assert((await page.locator('#stats').innerText()).includes('1'));
    await page.setViewportSize({width:390,height:844});
    await page.click('[data-view=cadastros]');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'overflow horizontal no viewport móvel');
    await page.click('[data-view=backup]');
    assert(await page.locator('#exportBackup').isVisible());
    await page.click('#logoutBtn');
    await page.locator('#authGate:not([hidden])').waitFor({state:'visible'});
    assert.equal(errors.length,0,'erros no navegador: '+errors.join(' | '));
    console.log('OK — login, persistência por usuário, cliente, obra, projeto, planta, circuitos, manutenção, logout e viewport 390×844 verificados em Chromium.');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exit(1)});

