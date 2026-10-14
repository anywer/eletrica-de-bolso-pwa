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
    assert.equal(await page.title(),'Elétrica de Bolso 0.9.1.1');
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
    await page.selectOption('#modal select[name=category]',{label:'Sala'});
    await page.fill('#modal input[name=widthM]','4');
    await page.fill('#modal input[name=lengthM]','3');
    await page.fill('#modal input[name=rotation]','0');
    await page.locator('#modalForm button[type=submit]').click();
    assert.equal(await page.locator('.room').count(),1);
    assert((await page.locator('.room-label').innerText()).includes('4 × 3 m'));
    const salaBox=await page.locator('.room').boundingBox();
    assert(Math.abs(salaBox.width/salaBox.height-4/3)<.03,'proporção visual não corresponde a 4 × 3 m');
    await page.click('#newRoom');
    await page.fill('#modal input[name=name]','Cozinha');
    await page.selectOption('#modal select[name=category]',{label:'Cozinha'});
    await page.selectOption('#modal select[name=measureMode]',{label:'Área + largura'});
    await page.fill('#modal input[name=widthM]','3');
    await page.fill('#modal input[name=area]','6');
    assert.equal(await page.locator('#modal input[name=lengthM]').inputValue(),'2.00');
    await page.locator('#modalForm button[type=submit]').click();
    assert.equal(await page.locator('.room').count(),2);
    const cozinha=page.locator('.room').nth(1),cozinhaBox=await cozinha.boundingBox(),cozinhaLabel=await cozinha.locator('.room-label').boundingBox();
    await page.mouse.move(cozinhaLabel.x+40,cozinhaLabel.y+10);
    await page.mouse.down();
    await page.mouse.move(cozinhaLabel.x+10,cozinhaLabel.y+10,{steps:6});
    await page.mouse.up();
    assert.equal((await page.evaluate(()=>window.EDB_APP.getState().projects[0].roomConnections.length))>=1,true,'ímã não conectou ao arrastar pelo rótulo');
    const salaConnected=await page.locator('.room').first().boundingBox();
    await page.mouse.click(salaConnected.x+salaConnected.width/2,salaConnected.y+salaConnected.height/2);
    assert(await page.locator('#inspector [data-snap-room]').isVisible(),'controle para coincidir arestas ausente');
    assert(await page.locator('#inspector [data-toggle-fixed]').isVisible(),'controle para fixar posição ausente');
    await page.click('#inspector [data-toggle-fixed]');
    const fixedBefore=await page.evaluate(()=>{const r=window.EDB_APP.getState().projects[0].rooms[0];return{x:r.x,y:r.y,fixed:r.fixed}});
    assert.equal(fixedBefore.fixed,true,'posição não foi fixada');
    const fixedBox=await page.locator('.room').first().boundingBox();
    await page.mouse.move(fixedBox.x+fixedBox.width/2,fixedBox.y+fixedBox.height/2);await page.mouse.down();await page.mouse.move(fixedBox.x+fixedBox.width/2+50,fixedBox.y+fixedBox.height/2,{steps:3});await page.mouse.up();
    const fixedAfter=await page.evaluate(()=>{const r=window.EDB_APP.getState().projects[0].rooms[0];return{x:r.x,y:r.y}});
    assert.deepEqual(fixedAfter,{x:fixedBefore.x,y:fixedBefore.y},'cômodo fixado foi movido');
    await page.click('#inspector [data-toggle-fixed]');
    assert(await page.locator('#inspector [data-release]').isVisible(),'controle para soltar arestas ausente');
    await page.click('#inspector [data-release]');
    assert.equal(await page.evaluate(()=>window.EDB_APP.getState().projects[0].roomConnections.length),0,'arestas não foram liberadas');
    const cozinhaReleased=await page.locator('.room').nth(1).boundingBox();
    await page.mouse.move(cozinhaReleased.x+80,cozinhaReleased.y+80);await page.mouse.down();await page.mouse.move(cozinhaReleased.x+110,cozinhaReleased.y+80,{steps:4});await page.mouse.up();
    const cozinhaAway=await page.locator('.room').nth(1).boundingBox();
    await page.mouse.click(cozinhaAway.x+80,cozinhaAway.y+80);
    await page.click('#inspector [data-snap-room]');
    assert.equal((await page.evaluate(()=>window.EDB_APP.getState().projects[0].roomConnections.length))>=1,true,'controle manual não coincidiu as arestas');
    await page.click('#newRoom');
    await page.fill('#modal input[name=name]','Corredor');
    await page.fill('#modal input[name=widthM]','0.5');
    await page.fill('#modal input[name=lengthM]','3');
    await page.locator('#modalForm button[type=submit]').click();
    const corredorBox=await page.locator('.room').nth(2).boundingBox();
    assert(Math.abs(corredorBox.width/corredorBox.height-1/6)<.03,'cômodo estreito foi deformado por tamanho mínimo');
    assert.equal(await page.locator('#electricalTools').isHidden(),true,'ferramentas elétricas apareceram antes da confirmação');
    await page.click('#zoomOut');
    await page.click('#zoomIn');
    await page.click('#fitPlan');
    await page.click('#confirmArchitecture');
    assert.equal(await page.locator('#electricalTools').isVisible(),true,'etapa elétrica não foi liberada');
    assert((await page.locator('#sharedWallSummary').innerText()).includes('Cozinha'),'parede compartilhada não foi informada');
    const focusedBefore=await page.locator('.room').boundingBox();
    await page.dispatchEvent('#planBoard','pointerdown',{pointerId:21,pointerType:'touch',clientX:120,clientY:220});
    await page.dispatchEvent('#planBoard','pointerdown',{pointerId:22,pointerType:'touch',clientX:220,clientY:220});
    await page.dispatchEvent('#planBoard','pointermove',{pointerId:22,pointerType:'touch',clientX:270,clientY:220});
    await page.dispatchEvent('#planBoard','pointerup',{pointerId:22,pointerType:'touch',clientX:270,clientY:220});
    await page.dispatchEvent('#planBoard','pointerup',{pointerId:21,pointerType:'touch',clientX:120,clientY:220});
    await page.waitForTimeout(50);
    const focusedAfter=await page.locator('.room').boundingBox();
    assert(focusedAfter.width>focusedBefore.width,'zoom por pinça não ampliou o cômodo');
    await page.click('#fitPlan');
    await page.click('[data-tool=tug]');
    await page.locator('.room').scrollIntoViewIfNeeded();
    const box=await page.locator('.room').boundingBox();
    await page.mouse.click(box.x+box.width-3,box.y+box.height/2);
    assert.equal(await page.locator('.point[data-type=tug]').count(),1);
    assert.equal((await page.evaluate(()=>window.EDB_APP.getState().projects[0].points[0].sharedWithRoomIds.length)),1,'ponto na parede não foi compartilhado');
    await page.selectOption('#electricalRoomSelect',{index:1});
    assert.equal(await page.locator('.point.shared[data-type=tug]').count(),1,'ponto compartilhado não apareceu no cômodo vizinho');
    await page.selectOption('#electricalRoomSelect',{index:0});
    await page.click('[data-tool=tue]');
    await page.mouse.click(box.x+160,box.y+100);
    await page.fill('#inspector input[name=label]','Ar-condicionado sala');
    await page.fill('#inspector input[name=circuit]','Climatização');
    await page.selectOption('#inspector select[name=loadType]',{label:'Ar-condicionado'});
    await page.click('#inspector [data-save-point]');
    await page.click('[data-tool=switch]');
    await page.mouse.click(box.x+100,box.y+150);
    await page.selectOption('#inspector select[name=controlType]',{label:'Paralelo'});
    await page.fill('#inspector input[name=circuit]','Iluminação');
    await page.click('#inspector [data-save-point]');
    assert.equal(await page.locator('.point[data-type=switch]').innerText(),'P');
    await page.click('[data-tool=board]');
    await page.mouse.click(box.x+160,box.y+150);
    assert.equal(await page.locator('.point[data-type=board]').count(),1);
    await page.click('[data-tool=segment]');
    await page.click('.point[data-type=tug]');
    await page.click('.point[data-type=tue]');
    await page.fill('#modal input[name=length]','8');
    await page.fill('#modal input[name=circuit]','Climatização');
    await page.locator('#modalForm button[type=submit]').click();

    await page.click('[data-view=dimensionamento]');
    await page.click('#autoCircuits');
    assert((await page.locator('#circuitTable').innerText()).includes('Climatização'));
    assert((await page.locator('#loadSummary').innerText()).includes('8 m'));
    const circuitCount=await page.locator('#circuitTable tr').count();
    await page.click('#autoCircuits');
    assert.equal(await page.locator('#circuitTable tr').count(),circuitCount,'atualização repetida não deve duplicar circuitos');
    assert((await page.locator('#boardChecklist').innerText()).includes('Não faça ponte neutro–terra'));
    await page.click('[data-view=manutencoes]');
    await page.click('#newMaintenance');
    await page.fill('#modal textarea[name=description]','Inspeção de teste');
    await page.locator('#modalForm button[type=submit]').click();
    assert((await page.locator('#maintenanceList').innerText()).includes('Inspeção de teste'));

    await page.reload({waitUntil:'networkidle'});
    await page.locator('#inicio.active').waitFor({state:'visible'});
    assert((await page.locator('#stats').innerText()).includes('1'));
    await page.setViewportSize({width:768,height:1024});
    await page.click('[data-view=planta]');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'overflow horizontal no tablet');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'overflow horizontal no viewport móvel');
    assert.equal(await page.locator('#planBoard').evaluate(element=>getComputedStyle(element).touchAction),'none');
    assert.equal(await page.locator('#inspector').evaluate((element,board)=>element.offsetTop>board.offsetTop,await page.locator('#planBoard').elementHandle()),true,'propriedades devem ficar abaixo da planta no celular');
    await page.setViewportSize({width:844,height:390});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,'overflow horizontal no celular em paisagem');
    await page.setViewportSize({width:390,height:844});
    await page.click('#architectureStage');
    assert.equal(await page.locator('.point').count(),0,'pontos elétricos não devem aparecer na etapa arquitetônica');
    assert(await page.locator('#newRoom').isVisible());
    await page.click('#electricalStage');
    assert((await page.locator('.point').count())>=4,'pontos elétricos não foram preservados');
    const savedState=await page.evaluate(()=>window.EDB_APP.getState());
    assert.equal(savedState.schemaVersion,9);
    assert.equal(savedState.projects[0].rooms[0].area,12);
    assert.equal(savedState.projects[0].planConfirmed,true);
    await page.click('[data-view=backup]');
    assert(await page.locator('#exportBackup').isVisible());
    await page.click('#logoutBtn');
    await page.locator('#authGate:not([hidden])').waitFor({state:'visible'});
    assert.equal(errors.length,0,'erros no navegador: '+errors.join(' | '));

    const migrationContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    await migrationContext.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
    await migrationContext.addInitScript(()=>{
      localStorage.setItem('edb-mock-auth','1');
      localStorage.setItem('eletrica-bolso:v0.7',JSON.stringify({schemaVersion:7,clients:[{id:'c1',name:'Cliente antigo'}],properties:[{id:'o1',clientId:'c1',name:'Casa antiga'}],projects:[{id:'p1',clientId:'c1',propertyId:'o1',name:'Projeto antigo',rooms:[{id:'r1',name:'Sala antiga',x:10,y:20,w:240,h:180}],points:[{id:'pt1',roomId:'r1',type:'tug',x:30,y:40,label:'TUG antiga',power:100}],segments:[],circuits:[]}],maintenances:[],active:{clientId:'c1',propertyId:'o1',projectId:'p1'}}));
    });
    await migrationContext.addInitScript(installFirebaseMock);
    const migrationPage=await migrationContext.newPage();
    await migrationPage.goto(url,{waitUntil:'networkidle'});
    await migrationPage.locator('#inicio.active').waitFor({state:'visible'});
    const migrated=await migrationPage.evaluate(()=>window.EDB_APP.getState());
    assert.equal(migrated.schemaVersion,9);
    assert.equal(migrated.clients[0].name,'Cliente antigo');
    assert.equal(migrated.projects[0].points[0].label,'TUG antiga');
    assert.equal(migrated.projects[0].rooms[0].widthM,4);
    assert.equal(migrated.projects[0].rooms[0].lengthM,3);
    assert.equal(migrated.projects[0].rooms[0].area,12);
    assert.equal(migrated.projects[0].planStage,'electrical');
    assert.equal(migrated.projects[0].planConfirmed,true);
    assert.equal(await migrationPage.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('eletrica-bolso:v0.7:legacy-backup:'))),true);
    await migrationContext.close();
    console.log('OK — login, área vinculada, ímã, arestas conectadas, pinça, elétrica por cômodo, parede compartilhada, migração e viewport móvel verificados em Chromium.');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exit(1)});
