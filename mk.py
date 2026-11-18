page2('A_leger',{'intensite':'leger'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-leger-nb",tot.every(function(n){return n===3+1}));L("alea-leger-valeurs",tot.join(","));
''')
page2('A_equilibre',{'intensite':'equilibre'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-equilibre-nb",tot.every(function(n){return n===4+1}));L("alea-equilibre-valeurs",tot.join(","));
''')
page2('A_soutenu',{'intensite':'soutenu'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-soutenu-nb",tot.every(function(n){return n===5+1}));L("alea-soutenu-valeurs",tot.join(","));
''')
page2('A_leger',{'intensite':'leger'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-leger-nb",tot.every(function(n){return n===3+1}));L("alea-leger-valeurs",tot.join(","));
''')
page2('A_equilibre',{'intensite':'equilibre'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-equilibre-nb",tot.every(function(n){return n===4+1}));L("alea-equilibre-valeurs",tot.join(","));
''')
page2('A_soutenu',{'intensite':'soutenu'},r'''
var tot=[];
for(var k=0;k<12;k++){location.hash="#/aleatoire";await sleep(120);document.querySelector("[data-alea]").click();await sleep(150);tot.push(document.querySelectorAll("#alea .exo").length);}
ok("alea-soutenu-nb",tot.every(function(n){return n===5+1}));L("alea-soutenu-valeurs",tot.join(","));
''')
