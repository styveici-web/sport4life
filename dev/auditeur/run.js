// Lance les deux batteries de l'auditeur ; sort en erreur (exit 1) si une ligne FAIL ou ERR apparait.
const {execFileSync}=require('child_process');
const path=require('path');
let bad=0;
// Minimums de lignes « ok » attendues : une batterie qui ne tourne pas (0 ligne) doit faire echouer la CI.
const minOk={'s4l-fuzz.js':50,'s4l-extremes.js':12};
for(const s of ['s4l-fuzz.js','s4l-extremes.js']){
  const out=execFileSync(process.execPath,[path.join(__dirname,s)],{encoding:'utf8',env:process.env});
  process.stdout.write(out);
  const lignes=out.split('\n');
  lignes.forEach(l=>{if(/^FAIL |\bERR /.test(l))bad++;});
  const ok=lignes.filter(l=>/^ok\b| ok$/.test(l)).length;
  if(ok<minOk[s]){console.error('auditeur: '+s+' na produit que '+ok+' lignes ok (minimum '+minOk[s]+')');bad++;}
}
if(bad){console.error('auditeur: '+bad+' ligne(s) en echec');process.exit(1);}
console.log('auditeur: tout est vert');
