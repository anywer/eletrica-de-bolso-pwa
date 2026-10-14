/**
 * Adapter between Elétrica de Bolso and countzero/ai_room_planner (MIT).
 * Geometry is stored in centimetres; camera zoom/pan never mutates it.
 */
const PlannerBridge=(()=>{
  let board,canvas,project,onChange=()=>{},onSelect=()=>{},projectId=null,tool='select',snap=true;
  let pointers=new Map(),gesture=null,drag=null,wallStart=null,selection=null,resizeObserver=null;
  const SCALE=60/100, EPS=.01;
  const same=(a,b)=>Math.abs(a-b)<EPS;
  const point=(e)=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  const world=e=>{const p=point(e);return CanvasRenderer.screenToWorld(p.x,p.y)};
  const snapshot=()=>JSON.stringify(Model.getState().walls);
  function snapPoint(p,exclude=null){
    if(!snap)return p;
    const threshold=CanvasRenderer.screenToWorldDist(18),hit=Model.snapToExistingPoint(p.x,p.y,threshold,exclude);
    if(hit)return hit;
    return{x:Geometry.snapToGrid(p.x),y:Geometry.snapToGrid(p.y)};
  }
  function roomMeta(key){return Model.getState().roomMeta?.[key]||{}}
  function bbox(poly){const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y);return{minX:Math.min(...xs),minY:Math.min(...ys),maxX:Math.max(...xs),maxY:Math.max(...ys)}}
  function syncRooms(){
    const old=new Map(project.rooms.map(r=>[r.architectureKey||'',r])),used=new Set(),next=[];
    for(const room of Model.rooms){
      const box=bbox(room.polygon),meta=roomMeta(room.key),existing=old.get(room.key)||project.rooms.find(r=>!used.has(r.id)&&(r.id===meta.legacyId||r.name===meta.label));
      const id=existing?.id||meta.legacyId||`room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;used.add(id);
      const row={...existing,id,architectureKey:room.key,name:meta.label||existing?.name||`Cômodo ${next.length+1}`,category:meta.category||existing?.category||'Personalizado',x:box.minX*SCALE,y:box.minY*SCALE,w:(box.maxX-box.minX)*SCALE,h:(box.maxY-box.minY)*SCALE,widthM:(box.maxX-box.minX)/100,lengthM:(box.maxY-box.minY)/100,area:room.area/10000,rotation:0,polygon:room.polygon.map(p=>({x:p.x*SCALE,y:p.y*SCALE}))};
      next.push(row);Model.updateRoomMeta(room.key,{label:row.name,category:row.category,legacyId:id});
    }
    const valid=new Set(next.map(r=>r.id)),nextById=new Map(next.map(r=>[r.id,r])),oldById=new Map(project.rooms.map(r=>[r.id,r]));project.points=project.points.filter(p=>valid.has(p.roomId)).map(p=>{const from=oldById.get(p.roomId),to=nextById.get(p.roomId);return{...p,x:from&&to&&from.w?to.x+(p.x-from.x)*to.w/from.w:p.x,y:from&&to&&from.h?to.y+(p.y-from.y)*to.h/from.h:p.y,sharedWithRoomIds:(p.sharedWithRoomIds||[]).filter(id=>valid.has(id))}});project.rooms=next;
  }
  function commit(message){project.architecture=Model.getState();syncRooms();project.planConfirmed=false;CanvasRenderer.render();onChange(message);}
  function addSegment(a,b){if(Geometry.dist(a.x,a.y,b.x,b.y)<10)return null;return Model.addWall(a.x,a.y,b.x,b.y,12,'#2d4558')}
  function migrateLegacy(){
    Model.clear();
    for(const r of project.rooms){
      const x=(+r.x||40)/SCALE,y=(+r.y||40)/SCALE,w=(+r.w||(+r.widthM||4)*60)/SCALE,h=(+r.h||(+r.lengthM||3)*60)/SCALE,angle=(+r.rotation||0)*Math.PI/180,cx=x+w/2,cy=y+h/2;
      const corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>({x:cx+(px-cx)*Math.cos(angle)-(py-cy)*Math.sin(angle),y:cy+(px-cx)*Math.sin(angle)+(py-cy)*Math.cos(angle)}));
      for(let i=0;i<4;i++)addSegment(corners[i],corners[(i+1)%4]);
      const detected=Model.rooms.at(-1);if(detected)Model.updateRoomMeta(detected.key,{label:r.name||'Cômodo',category:r.category||'Personalizado',legacyId:r.id});
    }
    project.architecture=Model.getState();syncRooms();
  }
  function renderSelection(){CanvasRenderer.setSelection(selection);CanvasRenderer.render();onSelect(selection?describe(selection):null)}
  function describe(sel){
    if(sel.type==='wall'){const w=Model.getWall(sel.id);return w?{kind:'wall',id:w.id,length:Geometry.dist(w.x1,w.y1,w.x2,w.y2)/100}:null}
    if(sel.type==='room'){const r=Model.rooms.find(x=>x.key===sel.key),m=r&&roomMeta(r.key);return r?{kind:'room',key:r.key,id:m.legacyId,name:m.label||'Cômodo',category:m.category||'Personalizado',area:r.area/10000}:null}
    return null;
  }
  function selectAt(p){
    const threshold=CanvasRenderer.screenToWorldDist(14),end=Model.findWallEndpointAt(p.x,p.y,threshold),wall=Model.findWallAt(p.x,p.y,threshold),room=Model.getRoomAtPoint(p.x,p.y);
    if(end){selection={type:'wall',id:end.wall.id};return{kind:'endpoint',wall:end.wall,endpoint:end.endpoint,origin:end.endpoint===1?{x:end.wall.x1,y:end.wall.y1}:{x:end.wall.x2,y:end.wall.y2}}}
    if(wall){selection={type:'wall',id:wall.id};return{kind:'wall',wall,start:{...wall},origin:p}}
    if(room){selection={type:'room',key:room.key};return null}
    selection=null;return null;
  }
  function connectedMove(origin,next){
    const updates=[];for(const w of Model.walls){const props={};if(same(w.x1,origin.x)&&same(w.y1,origin.y))Object.assign(props,{x1:next.x,y1:next.y});if(same(w.x2,origin.x)&&same(w.y2,origin.y))Object.assign(props,{x2:next.x,y2:next.y});if(Object.keys(props).length)updates.push({id:w.id,props})}Model.updateWalls(updates)
  }
  function pointerDown(e){
    try{canvas.setPointerCapture?.(e.pointerId)}catch{}pointers.set(e.pointerId,point(e));
    if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:CanvasRenderer.getZoom(),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};drag=null;return}
    const p=world(e);if(tool==='wall'){drag={kind:'wall-click',start:point(e)};return}
    if(tool==='grab'){drag={kind:'pan',screen:point(e)};return}
    drag=selectAt(p);if(!drag)drag={kind:'pan',screen:point(e)};drag.before=snapshot();renderSelection();
  }
  function pointerMove(e){
    if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,point(e));
    if(pointers.size===2&&gesture){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance=Math.hypot(a.x-b.x,a.y-b.y);CanvasRenderer.setZoom(gesture.zoom*distance/Math.max(1,gesture.distance),gesture.mid.x,gesture.mid.y);CanvasRenderer.pan(mid.x-gesture.mid.x,mid.y-gesture.mid.y);CanvasRenderer.render();gesture={distance,zoom:CanvasRenderer.getZoom(),mid};return}
    if(!drag)return;const s=point(e);
    if(drag.kind==='pan'){CanvasRenderer.pan(s.x-drag.screen.x,s.y-drag.screen.y);CanvasRenderer.render();drag.screen=s;return}
    if(drag.kind==='endpoint'){const next=snapPoint(world(e),drag.wall.id);connectedMove(drag.origin,next);CanvasRenderer.setSnapIndicator(next);CanvasRenderer.render();return}
    if(drag.kind==='wall'){const p=world(e),dx=p.x-drag.origin.x,dy=p.y-drag.origin.y,a={x:drag.start.x1,y:drag.start.y1},b={x:drag.start.x2,y:drag.start.y2};connectedMove(a,{x:a.x+dx,y:a.y+dy});connectedMove(b,{x:b.x+dx,y:b.y+dy});CanvasRenderer.render()}
  }
  function pointerUp(e){
    const click=drag?.kind==='wall-click'&&Geometry.dist(drag.start.x,drag.start.y,point(e).x,point(e).y)<8;
    pointers.delete(e.pointerId);if(pointers.size<2)gesture=null;
    if(click){const p=snapPoint(world(e));if(!wallStart){wallStart=p;CanvasRenderer.setWallDrawPoints([p]);CanvasRenderer.setSnapIndicator(p)}else{const wall=addSegment(wallStart,p);wallStart=p;CanvasRenderer.setWallDrawPoints([p]);if(wall)commit('Parede adicionada')};CanvasRenderer.render();drag=null;return}
    if(drag&&['endpoint','wall'].includes(drag.kind)&&drag.before!==snapshot())commit('Planta atualizada');CanvasRenderer.setSnapIndicator(null);drag=null;
  }
  function wheel(e){e.preventDefault();const p=point(e);CanvasRenderer.setZoom(CanvasRenderer.getZoom()*(e.deltaY<0?1.12:.89),p.x,p.y);CanvasRenderer.render()}
  function keydown(e){if(e.key==='Escape'){wallStart=null;CanvasRenderer.setWallDrawPoints([]);CanvasRenderer.setSnapIndicator(null);CanvasRenderer.render()}if((e.key==='Delete'||e.key==='Backspace')&&selection?.type==='wall'&&document.activeElement===canvas){Model.removeWall(selection.id);selection=null;commit('Parede excluída');renderSelection()}}
  function mount(nextProject,callbacks={}){
    project=nextProject;onChange=callbacks.onChange||(()=>{});onSelect=callbacks.onSelect||(()=>{});board=document.getElementById('planBoard');
    if(projectId===project.id&&canvas?.isConnected){CanvasRenderer.render();return}
    projectId=project.id;board.replaceChildren();canvas=document.createElement('canvas');canvas.id='plannerCanvas';canvas.tabIndex=0;canvas.setAttribute('aria-label','Editor arquitetônico em escala');board.append(canvas);CanvasRenderer.init(canvas);
    if(project.architecture?.walls)Model.setState(project.architecture);else migrateLegacy();snap=project.snapEnabled!==false;
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',keydown);
    resizeObserver=new ResizeObserver(()=>CanvasRenderer.resize());resizeObserver.observe(board);CanvasRenderer.resize();requestAnimationFrame(()=>CanvasRenderer.fitToView());syncRooms();
  }
  function unmount(){if(!canvas)return;resizeObserver?.disconnect();projectId=null;canvas=null;pointers.clear();gesture=drag=null}
  function addRoom(data){
    const all=Model.walls,far=all.length?Math.max(...all.flatMap(w=>[w.x1,w.x2]))+100:50,x=far,y=50,w=data.widthM*100,h=data.lengthM*100,pts=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];for(let i=0;i<4;i++)addSegment(pts[i],pts[(i+1)%4]);const room=Model.rooms.find(r=>Geometry.pointInPolygon(x+w/2,y+h/2,r.polygon));if(room)Model.updateRoomMeta(room.key,{label:data.name,category:data.category,legacyId:data.id});commit('Cômodo salvo');CanvasRenderer.fitToView();return room}
  function updateRoom(key,data){Model.updateRoomMeta(key,{label:data.name,category:data.category});commit('Cômodo atualizado')}
  function removeSelection(){if(selection?.type==='wall'){Model.removeWall(selection.id);selection=null;commit('Parede excluída');renderSelection()}}
  function setTool(value){tool=value;wallStart=null;CanvasRenderer.setWallDrawPoints([]);CanvasRenderer.setSnapIndicator(null);CanvasRenderer.render()}
  function setSnap(value){snap=!!value}
  function zoom(factor){const c={x:CanvasRenderer.width/2,y:CanvasRenderer.height/2};CanvasRenderer.setZoom(CanvasRenderer.getZoom()*factor,c.x,c.y);CanvasRenderer.render()}
  function fit(){CanvasRenderer.fitToView()}
  function setWallLength(id,metres){const w=Model.getWall(id),length=+metres*100;if(!w||!Number.isFinite(length)||length<=0)return false;const angle=Math.atan2(w.y2-w.y1,w.x2-w.x1),origin={x:w.x2,y:w.y2};connectedMove(origin,{x:w.x1+Math.cos(angle)*length,y:w.y1+Math.sin(angle)*length});commit('Comprimento da parede atualizado');return true}
  function geometry(){return Model.getState()}
  return{mount,unmount,addRoom,updateRoom,removeSelection,setTool,setSnap,zoom,fit,setWallLength,geometry,sync:()=>commit()};
})();
window.PlannerBridge=PlannerBridge;
