import {flip,type AnimationConfig,type FlipParams} from 'svelte/animate';
import {cubicOut} from 'svelte/easing';
import {elementPose,localVector} from './coordinates';

/** FLIP rectangles use screen coordinates; rotated racks need local offsets. */
export function rackFlip(node:HTMLElement,rects:{from:DOMRect;to:DOMRect},params:FlipParams={},rotation=0):AnimationConfig {
 if(((rotation%360)+360)%360===0)return flip(node,rects,params);
 const {from,to}=rects,parent=elementPose(node.parentElement!),style=getComputedStyle(node);
 const transform=style.transform==='none'?'':style.transform;
 const delta=localVector(from.left+from.width/2-to.left-to.width/2,from.top+from.height/2-to.top-to.height/2,parent);
 const sideways=Math.abs(Math.sin(parent.angle*Math.PI/180))>.5;
 const sx=sideways?from.height/to.height:from.width/to.width,sy=sideways?from.width/to.width:from.height/to.height;
 const duration=params.duration??460;
 return {delay:params.delay??0,duration:typeof duration==='function'?duration(Math.hypot(delta.x,delta.y)):duration,easing:params.easing??cubicOut,
  css:(t,u)=>`transform: ${transform} translate(${u*delta.x}px, ${u*delta.y}px) scale(${t+u*sx}, ${t+u*sy});`};
}
