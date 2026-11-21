import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('static/art/digital/prompts.json','utf8'));
const report=[];
for(const asset of manifest.assets){
 await mkdir('static/art/source/digital',{recursive:true});
 await readFile(asset.source);
 const metadata=await sharp(asset.source).metadata();
 if(asset.transparent){const alpha=(await sharp(asset.source).stats()).channels[3];if(!alpha||alpha.min!==0||alpha.max<250)throw Error(`${asset.id}: missing genuine alpha`);}
 await sharp(asset.source).resize({width:asset.transparent?720:1200,withoutEnlargement:true}).webp(asset.transparent?{lossless:true}:{quality:92}).toFile(asset.output.replace(/^\//,''));
 report.push({id:asset.id,width:metadata.width,height:metadata.height,hasAlpha:metadata.hasAlpha});
}
await writeFile('static/art/digital/manifest.json',JSON.stringify(report,null,2)+'\n');
console.log(`Prepared ${manifest.assets.length} independent digital art assets; transparent layers use lossless WebP.`);
