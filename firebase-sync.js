(()=>{'use strict';
const FIREBASE_CONFIG=Object.freeze({
  apiKey:'AIzaSyBKlONyDy_AhZgLbWfTg9H2LYYHARgulAc',
  authDomain:'eletrica-de-bolso-pwa.firebaseapp.com',
  projectId:'eletrica-de-bolso-pwa',
  storageBucket:'eletrica-de-bolso-pwa.firebasestorage.app',
  messagingSenderId:'841580930974',
  appId:'1:841580930974:web:bb2b186e7a8e97e516d88f'
});
const $=selector=>document.querySelector(selector);
let appApi=null,auth=null,db=null,cloudUser=null,cloudRef=null,unsubscribeCloud=null,syncTimer=null,syncReady=false;

function setSyncStatus(text,kind=''){
  const element=$('#syncStatus');
  if(!element)return;
  element.textContent=text;
  element.dataset.state=kind;
}

function setAuthMessage(text,isError=false){
  const element=$('#authMessage');
  if(!element)return;
  element.textContent=text||'';
  element.classList.toggle('error',Boolean(isError));
}

function setAuthBusy(busy){
  document.querySelectorAll('#authGate button,#authGate input').forEach(element=>{element.disabled=busy});
}

function friendlyError(error){
  const messages={
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/invalid-email':'Informe um e-mail válido.',
    'auth/email-already-in-use':'Este e-mail já possui uma conta.',
    'auth/weak-password':'Use uma senha com pelo menos 6 caracteres.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed':'Sem conexão. Tente novamente quando houver internet.',
    'auth/user-disabled':'Esta conta foi desativada.',
    'auth/operation-not-allowed':'Ative o acesso por E-mail/senha no Firebase Authentication.',
    'permission-denied':'A sincronização foi bloqueada pelas regras do Firestore.'
  };
  return messages[error?.code]||'Não foi possível concluir. Tente novamente.';
}

function showGate(mode='login',message='',isError=false){
  document.body.classList.remove('auth-pending');
  document.body.classList.add('auth-required');
  $('#authGate').hidden=false;
  $('#loginBox').hidden=mode!=='login';
  $('#verifyBox').hidden=mode!=='verify';
  $('#logoutBtn').hidden=true;
  $('#userEmail').hidden=true;
  setAuthMessage(message,isError);
  setTimeout(()=>{(mode==='login'?$('#authEmail'):$('#checkVerification'))?.focus()},0);
}

function showApplication(user){
  document.body.classList.remove('auth-pending','auth-required');
  $('#authGate').hidden=true;
  $('#logoutBtn').hidden=false;
  $('#userEmail').hidden=false;
  $('#userEmail').textContent=user.email||'Conta ativa';
}

function scheduleSync(){
  if(!syncReady||!cloudRef||!cloudUser?.emailVerified)return;
  clearTimeout(syncTimer);
  if(!navigator.onLine){setSyncStatus('Salvo offline','ok');return}
  setSyncStatus('Salvando…','busy');
  syncTimer=setTimeout(syncNow,700);
}

async function syncNow(){
  if(!syncReady||!cloudRef||!cloudUser?.emailVerified)return;
  if(!navigator.onLine){setSyncStatus('Salvo offline','ok');return}
  try{
    const payload=JSON.parse(JSON.stringify(appApi.getState()));
    await cloudRef.set({payload,appVersion:'0.8.0',schemaVersion:7,serverUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    setSyncStatus('Sincronizado','ok');
  }catch(error){
    console.warn('Falha de sincronização',error);
    setSyncStatus('Erro ao sincronizar','error');
  }
}

function listenForCloudChanges(){
  unsubscribeCloud=cloudRef.onSnapshot({includeMetadataChanges:true},snapshot=>{
    if(!snapshot.exists||snapshot.metadata.hasPendingWrites)return;
    const remote=snapshot.data()?.payload;
    if(!remote)return;
    const remoteTime=Date.parse(remote.updatedAt||0)||0;
    const localTime=Date.parse(appApi.getState().updatedAt||0)||0;
    if(remoteTime>localTime){
      appApi.applyCloudState(appApi.mergeStates(appApi.getState(),remote));
      setSyncStatus(snapshot.metadata.fromCache?'Disponível offline':'Sincronizado','ok');
      scheduleSync();
    }
  },error=>{
    console.warn('Atualizações da nuvem indisponíveis',error);
    setSyncStatus(navigator.onLine?'Erro ao sincronizar':'Salvo offline','error');
  });
}

async function startCloud(user){
  appApi.activateUserStorage(user.uid);
  cloudRef=db.collection('users').doc(user.uid).collection('app').doc('state');
  setSyncStatus('Carregando nuvem…','busy');
  try{
    const snapshot=await cloudRef.get();
    if(snapshot.exists&&snapshot.data()?.payload){
      appApi.applyCloudState(appApi.mergeStates(appApi.getState(),snapshot.data().payload));
    }
    syncReady=true;
    listenForCloudChanges();
    await syncNow();
  }catch(error){
    console.warn('Firestore indisponível',error);
    syncReady=!navigator.onLine;
    setSyncStatus(navigator.onLine?'Verifique o Firestore':'Salvo offline','error');
    if(syncReady)listenForCloudChanges();
  }
}

async function handleAuthState(user){
  if(unsubscribeCloud){unsubscribeCloud();unsubscribeCloud=null}
  clearTimeout(syncTimer);
  syncReady=false;
  cloudRef=null;
  cloudUser=user||null;
  if(!user){showGate('login');setSyncStatus('Conta desconectada');return}
  if(!user.emailVerified){
    showGate('verify','Verifique seu e-mail para liberar a sincronização.');
    $('#verifyEmail').textContent=user.email||'';
    return;
  }
  showApplication(user);
  await startCloud(user);
}

function bindAuthUi(){
  $('#loginForm').addEventListener('submit',async event=>{
    event.preventDefault();
    setAuthBusy(true);setAuthMessage('Entrando…');
    try{await auth.signInWithEmailAndPassword($('#authEmail').value.trim(),$('#authPassword').value)}
    catch(error){setAuthMessage(friendlyError(error),true)}
    finally{setAuthBusy(false)}
  });
  $('#createAccount').addEventListener('click',async()=>{
    const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
    if(!email||password.length<6){setAuthMessage('Informe um e-mail e uma senha com pelo menos 6 caracteres.',true);return}
    setAuthBusy(true);setAuthMessage('Criando conta…');
    try{
      const credential=await auth.createUserWithEmailAndPassword(email,password);
      await credential.user.sendEmailVerification();
      showGate('verify','E-mail de verificação enviado.');
      $('#verifyEmail').textContent=email;
    }catch(error){setAuthMessage(friendlyError(error),true)}
    finally{setAuthBusy(false)}
  });
  $('#resetPassword').addEventListener('click',async()=>{
    const email=$('#authEmail').value.trim();
    if(!email){setAuthMessage('Informe seu e-mail primeiro.',true);return}
    setAuthBusy(true);
    try{await auth.sendPasswordResetEmail(email);setAuthMessage('Enviamos o link para redefinir sua senha.')}
    catch(error){setAuthMessage(friendlyError(error),true)}
    finally{setAuthBusy(false)}
  });
  $('#logoutBtn').addEventListener('click',()=>auth.signOut());
  $('#verifyLogout').addEventListener('click',()=>auth.signOut());
  $('#resendVerification').addEventListener('click',async()=>{
    setAuthBusy(true);
    try{await auth.currentUser?.sendEmailVerification();setAuthMessage('Novo e-mail enviado.')}
    catch(error){setAuthMessage(friendlyError(error),true)}
    finally{setAuthBusy(false)}
  });
  $('#checkVerification').addEventListener('click',async()=>{
    setAuthBusy(true);
    try{
      await auth.currentUser?.reload();
      await auth.currentUser?.getIdToken(true);
      if(auth.currentUser?.emailVerified)await handleAuthState(auth.currentUser);
      else setAuthMessage('O e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.',true);
    }catch(error){setAuthMessage(friendlyError(error),true)}
    finally{setAuthBusy(false)}
  });
}

async function init(api){
  appApi=api;
  try{
    if(!window.firebase)throw new Error('Firebase não carregado');
    firebase.initializeApp(FIREBASE_CONFIG);
    auth=firebase.auth();
    db=firebase.firestore();
    auth.languageCode='pt-BR';
    try{await db.enablePersistence({synchronizeTabs:true})}
    catch(error){if(!['failed-precondition','unimplemented'].includes(error.code))console.warn('Persistência offline do Firestore indisponível',error)}
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    bindAuthUi();
    auth.onAuthStateChanged(handleAuthState);
  }catch(error){
    console.error('Falha ao iniciar Firebase',error);
    showGate('login','Não foi possível iniciar a conta. Verifique a conexão e recarregue.',true);
    setSyncStatus('Nuvem indisponível','error');
  }
}

window.addEventListener('online',()=>{if(syncReady)syncNow()});
window.EDB_CLOUD={init,scheduleSync};
})();

