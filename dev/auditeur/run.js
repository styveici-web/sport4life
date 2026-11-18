// Lance les deux batteries de l'auditeur ; sort en erreur (exit 1) si une ligne FAIL ou ERR apparait.
const {execFileSync}=require('child_process');
const path=require('path');
let bad=0;
for(const s of ['s4l-fuzz.js','s4l-extremes.js']){
  const out=execFileSync(process.execPath,[path.join(__dirname,s)],{encoding:'utf8',env:process.env});
  process.stdout.write(out);
  out.split('\n').forEach(l=>{if(/^FAIL |\bERR /.test(l))bad++;});
}
if(bad){console.error('auditeur: '+bad+' ligne(s) en echec');process.exit(1);}
console.log('auditeur: tout est vert');
