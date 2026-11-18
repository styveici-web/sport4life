const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const dir=process.env.S4L_DIR||require('path').join(__dirname,'..','..','sport4life-app')+'/';
const ids=[...fs.readFileSync(dir+'data/exercises.js','utf8').matchAll(/id:\s*"([a-z0-9-]+)"/g)].map(m=>m[1]);
const scripts=['data/exercises.js','data/foods.js','data/meals.js','guide.js','app.js'].map(f=>fs.readFileSync(dir+f,'utf8')); // skip images
const html=fs.readFileSync(dir+'index.html','utf8').replace(/<script src[^>]*><\/script>/g,'');
const X='<img src=x onerror="window.PWN=1">';const S='"><script>window.PWN=1</script>';
function run(name,seed,routes){
  return new Promise(res=>{
    const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>/Not implemented/.test(e.message)||errs.push((e.detail&&e.detail.stack||String(e.message)).split('\n').slice(0,3).join(' ').slice(0,260)));
    const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://x.test/',pretendToBeVisual:true,virtualConsole:vc});
    const w=dom.window;
    w.Capacitor=undefined;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.alert=()=>{};
    if(seed!==undefined) w.localStorage.setItem('sport4life.v1',typeof seed==='string'?seed:JSON.stringify(seed));
    try{ scripts.forEach(s=>w.eval(s)); }catch(e){errs.push('LOAD '+String(e).slice(0,120));}
    (async()=>{
      for(const r of routes){ try{ w.location.hash=r; w.dispatchEvent(new w.HashChangeEvent('hashchange')); await new Promise(z=>setTimeout(z,15)); }catch(e){errs.push('ROUTE '+r+' '+String(e).slice(0,100));}
        if(w.PWN) {errs.push('XSS-EXEC at '+r);break;}
        const bad=w.document.querySelector('#vue script, #vue img[src="x"], #vue [onerror]'); if(bad){errs.push('XSS-DOM at '+r);break;}
      }
      const empty=!w.document.getElementById('vue').innerHTML.trim();
      console.log((errs.length||empty?'FAIL ':'ok   ')+name+(empty?' [vue vide]':'')+' '+[...new Set(errs)].slice(0,3).join(' | '));
      w.close();res();
    })();
  });
}
const base=(x)=>Object.assign({id:'p1',nom:'T',taille:'180',poids:'75',age:'30',sexe:'h',activite:'1.55',materiel:['corps'],lieu:'lesdeux',valides:{},poidsLog:[],journal:{}},x||{});
const st=(p,extra)=>Object.assign({actif:p.id,profils:[p]},extra||{});
const R=['#/aujourdhui','#/exercices','#/repas','#/historique','#/profil','#/composer','#/aleatoire',...ids.slice(0,80).map(i=>'#/exercice/'+i)];
(async()=>{
 console.log('exos',ids.length);
 await run('vide',undefined,R);
 await run('json casse','{not json',R);
 await run('json null','null',R);
 await run('profils non tableau',{profils:'x',actif:1},R);
 await run('xss nom/note',st(base({nom:X+S,note:X+S,sexe:X,taille:X,poids:X,age:X,activite:X,lieu:X,intensite:X})),R);
 await run('xss ids exos validés',st(base({valides:{[X]:[X],'2026-11-18':[X,S]},journal:{[X]:{[X]:[{r:X,k:X}]}},poidsLog:[{d:X,p:X}]})),R);
 await run('types faux',st(base({nom:{a:1},note:[1],materiel:'corps',valides:[],poidsLog:{},journal:[],taille:{},poids:[],age:null})),R);
 await run('materiel poisons',st(base({materiel:[X,null,1,{},'__proto__','constructor']})),R);
 await run('nombres extremes',st(base({taille:'1e999',poids:'-5',age:'NaN',sexe:'x'})),R);
 await run('nombres extremes2',st(base({taille:'0',poids:'0',age:'0'})),R);
 await run('poids gigantesque',st(base({taille:'999999',poids:'99999999',age:'200'})),R);
 await run('perso/aleatoire hostiles',st(base({perso:{date:X,exos:[X,'__proto__']},aleatoire:{date:'2026-11-18',exos:[null,1],repas:X}})),R);
 await run('alimentation hostile',st(base({alimentation:{regime:X,exclus:[X],aimes:'x',pasAimes:{}}})),R);
 await run('proto pollution',JSON.stringify({actif:'p1',profils:[base()],"__proto__":{polluted:1}}).replace('"__proto__"','"__proto__"'),R);
 // matrice equipement
 const MAT=['corps','banc','barre','halteres','halteres-reglables','disques','elastique','kettlebell','abwheel','corde','medball','gilet','autre'];
 for(const lieu of ['maison','exterieur','lesdeux']) for(const mat of [[],['corps'],MAT,['barre'],['elastique']]) for(const sx of ['h','f','']) await run(`matrice lieu=${lieu} mat=${mat.length} sexe=${sx||'-'}`,st(base({lieu,materiel:mat,sexe:sx})),R.slice(0,8));
 await run('profils 50',{actif:'p0',profils:Array.from({length:50},(_,i)=>base({id:'p'+i,nom:'P'+i}))},R.slice(0,8));
 process.exit(0);
})();
