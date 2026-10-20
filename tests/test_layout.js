/* Word Quest shared-shell regression checks (Node.js, no dependencies). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const context={window:{}};
vm.runInNewContext(read('site-shell.js'),context);
const shell=context.window.WordQuestShell;

const home=shell.header({home:true});
assert.match(home,/<header class="wq-header navline top">/);
assert.match(home,/WORD QUEST/);
assert.match(home,/Etymonline/);
assert.doesNotMatch(home,/data-action="view"/);
assert.match(home,/href="index.html"/);
const u1=shell.header({unit:1,active:'vault',chinese:true});
assert.match(u1,/G7A · U1/);
assert.match(u1,/data-action="view" data-view="vault" data-val="vault"/);
assert.match(u1,/data-action="view" data-view="play" data-val="play"/);
assert.match(u1,/class="wq-navbtn navbtn nav active" data-action="view" data-view="vault"/);
assert.match(u1,/词汇库/);
const u2=shell.header({unit:2,active:'map'});
assert.match(u2,/data-view="map"/);
assert.match(u2,/data-val="map"/);
assert.match(u2,/G7A · U2/);
assert.doesNotMatch(u2,/词汇库/);
assert.match(shell.footer(),/<footer class="wq-footer foot footer">/);

const htmls=['index.html',...Array.from({length:6},(_,n)=>'unit'+(n+1)+'.html')];
for(const name of htmls){
  const html=read(name);
  assert.match(html, /href="site.css"/,'Shared CSS in '+name);
  assert.match(html, /src="site-shell.js"/,'Shared template in '+name);
  assert.match(html, /src="site-version.js"/,'Shared version in '+name);
  const cssAt=html.indexOf('href="site.css"');
  const cssBase=html.indexOf('href="'+'quest.css'+'"');
  assert.ok(cssAt>cssBase,'Shared CSS overrides page CSS on '+name);
}
const first=read('unit1.html');
assert.doesNotMatch(first,/<style\b|<script>(?!\s*<\/script>)/,'Unit 1 is purely declarative HTML');
assert.match(first,/src="unit1-data.js"/);
assert.match(first,/src="quest.js"/);
assert.match(first,/href="quest.css"/);
assert.doesNotMatch(first,/src="unit1.js"|href="unit1.css"/);
const unitData=read('unit1-data.js');
assert.match(unitData,/const missions=\[/,'Preserve all Unit 1 missions as data');
const engine=read('quest.js');
assert.match(engine,/window\.WordQuestUnit1/);
assert.match(engine,/window\.WordQuestShell\.footer\(\)/);
assert.match(engine,/wordquest_g7u1_v1/,'Preserve Unit 1 progress key');
assert.match(engine,/wordquest_g7u.*semester_v1/,'Preserve others');
assert.match(read('site-version.js'),/const VERSION='1\.5\.1'/);
console.log('Shared layout tests passed (home + 6 units + actions + styles + progress keys).');