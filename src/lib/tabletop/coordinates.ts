/** A component's actual on-screen pose, including rotated/scaled ancestors. */
export interface ScreenPose {x:number;y:number;width:number;height:number;angle:number;scale:number}
export function elementPose(node:HTMLElement):ScreenPose {
 let angle=0;
 for(let el:HTMLElement|null=node;el;el=el.parentElement){const transform=getComputedStyle(el).transform;if(transform!=='none'){const matrix=new DOMMatrixReadOnly(transform);angle+=Math.atan2(matrix.b,matrix.a);}}
 const box=node.getBoundingClientRect(),width=node.offsetWidth,height=node.offsetHeight;
 const cos=Math.cos(angle),sin=Math.sin(angle),projected=Math.abs(cos)*width+Math.abs(sin)*height;
 const scale=projected?box.width/projected:1;
 return {x:box.left+box.width/2-(cos*width-sin*height)*scale/2,y:box.top+box.height/2-(sin*width+cos*height)*scale/2,width,height,angle:angle*180/Math.PI,scale};
}
export function localVector(x:number,y:number,pose:ScreenPose){const angle=pose.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);return {x:(cos*x+sin*y)/pose.scale,y:(-sin*x+cos*y)/pose.scale};}
export function localPoint(x:number,y:number,pose:ScreenPose){return localVector(x-pose.x,y-pose.y,pose);}
