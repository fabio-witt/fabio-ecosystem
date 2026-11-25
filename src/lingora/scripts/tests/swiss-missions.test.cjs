const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./load.cjs');
const {swissMissions,updateMissionMistakes}=load('features/learn/swiss-missions.ts');
test('mission mistakes stay isolated and disappear after a correct answer',()=>{
 const before={'viewing:0':true,'interview:1':true};
 assert.deepEqual(updateMissionMistakes(before,'viewing',0,true),{'interview:1':true});
 assert.deepEqual(before,{'viewing:0':true,'interview:1':true});
 assert.equal(updateMissionMistakes({},'appointment',1,false)['appointment:1'],true);
});
test('all missions have unique ids, usable phrases, role-play and valid choices',()=>{
 assert.equal(new Set(swissMissions.map(m=>m.id)).size,swissMissions.length);
 for(const m of swissMissions){
 assert.ok(m.phrases.length>=3 && m.roleplay && m.exercises.length>=2);
 for(const ex of m.exercises){assert.equal(ex.type,'choice');assert.ok(ex.options[ex.answer]);assert.equal(new Set(ex.options).size,ex.options.length);}
 }
});
