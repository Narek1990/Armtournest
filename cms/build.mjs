import { mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const base = process.cwd();
mkdirSync(join(base, 'dist'), {recursive:true});
for (const name of ['index.html', 'app.js', 'style.css']) copyFileSync(join(base, name), join(base,'dist',name));
console.log('ArmTourNest Content Studio compiled');
