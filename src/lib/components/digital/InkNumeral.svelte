<script lang="ts">
 let {value,width=720,height=720,centerX,centerY,fontSize}:{value:number|string;width?:number;height?:number;centerX:number;centerY:number;fontSize:number}=$props();
 let position=$state({x:0,y:0,ready:false});
 $effect(()=>{
  const number=String(value),size=fontSize,cx=centerX,cy=centerY;let current=true;
  document.fonts.load(`700 ${size}px "Atkinson Hyperlegible"`,number).then(()=>{
   if(!current)return;const context=document.createElement('canvas').getContext('2d');if(!context)return;
   context.font=`700 ${size}px "Atkinson Hyperlegible"`;context.fontKerning='none';
   const ink=context.measureText(number);
   position={x:cx-(ink.actualBoundingBoxRight-ink.actualBoundingBoxLeft)/2,y:cy+(ink.actualBoundingBoxAscent-ink.actualBoundingBoxDescent)/2,ready:true};
  });
  return()=>{current=false;};
 });
</script>
<svg class="ink-numeral" viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><text x={position.ready?position.x:centerX} y={position.ready?position.y:centerY+fontSize*.33} text-anchor={position.ready?'start':'middle'} font-size={fontSize}>{value}</text></svg>
<style>
 .ink-numeral{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}text{fill:currentColor;font-family:'Atkinson Hyperlegible',sans-serif;font-weight:700;font-kerning:none;font-feature-settings:normal;font-variant-numeric:normal;letter-spacing:0}
</style>
