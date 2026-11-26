import {rm,writeFile,mkdir,copyFile} from 'node:fs/promises';
// Preserve original paintings in Git; serve optimized images and editable SVGs.
await rm('build/art/source',{recursive:true,force:true});
await writeFile('build/.nojekyll','');
// Directory aliases work on plain static hosts as well as GitHub Pages.
for(const route of ['gallery','gallery/print','gallery/launchers','play','tabletop']){
 await mkdir(`build/${route}`,{recursive:true});
 await copyFile(`build/${route}.html`,`build/${route}/index.html`);
}
