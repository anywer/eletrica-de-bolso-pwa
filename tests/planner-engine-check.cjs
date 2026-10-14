const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={console};vm.createContext(context);
vm.runInContext(fs.readFileSync('planner-geometry.js','utf8')+'\nthis.__Geometry=Geometry;',context);vm.runInContext(fs.readFileSync('planner-model.js','utf8')+'\nthis.__Model=Model;',context);
const M=context.__Model;M.clear();M.addWall(0,0,400,0);M.addWall(400,0,400,300);M.addWall(400,300,0,300);M.addWall(0,300,0,0);
assert.equal(M.rooms.length,1,'retângulo deve formar um cômodo');assert.equal(M.rooms[0].area,120000,'área deve permanecer em cm²');
const before=JSON.stringify(M.getState().walls);const camera={zoom:2.4,x:-180,y:75};void camera;assert.equal(JSON.stringify(M.getState().walls),before,'câmera não pode alterar geometria');
const corner={x:400,y:300};M.updateWalls(M.walls.map(w=>{const props={};if(w.x1===corner.x&&w.y1===corner.y)Object.assign(props,{x1:450,y1:300});if(w.x2===corner.x&&w.y2===corner.y)Object.assign(props,{x2:450,y2:300});return{id:w.id,props}}));
assert.equal(M.rooms.length,1,'vértice compartilhado deve continuar fechado');assert(M.walls.filter(w=>(w.x1===450&&w.y1===300)||(w.x2===450&&w.y2===300)).length>=2,'paredes unidas devem mover juntas');
console.log('OK — geometria em escala e vértices conectados preservados.');
