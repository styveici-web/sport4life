const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');const dir=process.env.S4L_DIR||require('path').join(__dirname,'..','..','sport4life-app')+'/';
const scripts=['data/exercises.js','data/foods.js','data/meals.js','guide.js','app.js'].map(f=>fs.readFileSync(dir+f,'utf8'));
const html=fs.readFileSync(dir+'index.html','utf8').replace(/<script src[^>]*><\/script>/g,'');
(async()=>{for(const [t,p,a] of [['999999','99999999','200'],['180','75','200'],['180','99999','30'],['999999','75','30'],['180','75','5'],['50','20','100']]){
 for(const r of ['#/aujourdhui','#/repas']){
 const vc=new VirtualConsole();let e=[];vc.on('jsdomError',x=>/Not impl/.test(x.message)||e.push(((x.detail&&x.detail.stack)||x.message).split('\n').slice(0,4).join(' ')));
 const w=new JSDOM(html,{runScripts:'outside-only',url:'https://x.test/',virtualConsole:vc}).window;w.scrollTo=()=>{};
 w.localStorage.setItem('sport4life.v1',JSON.stringify({actif:'p',profils:[{id:'p',nom:'T',taille:t,poids:p,age:a,sexe:'h',activite:'1.55',materiel:['corps'],lieu:'lesdeux',valides:{},poidsLog:[],journal:{}}]}));
 scripts.forEach(s=>w.eval(s));w.location.hash=r;w.dispatchEvent(new w.HashChangeEvent('hashchange'));await new Promise(z=>setTimeout(z,20));
 console.log(t,p,a,r,e.length?'ERR '+e[0].slice(0,300):'ok');w.close();}}process.exit(0)})();
