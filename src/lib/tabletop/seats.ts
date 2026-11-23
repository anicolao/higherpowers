/** Clockwise seating, independent of the order in which people arrive. */
export const tableSeats=['south-west','south','south-east','east','north-east','north','north-west','west'] as const;
export type TableSeat=typeof tableSeats[number];
export const isTableSeat=(seat:unknown):seat is TableSeat=>tableSeats.includes(seat as TableSeat);
export function seatPose(seat:TableSeat,portrait=false){
 const poses:Record<TableSeat,{x:number;y:number;angle:number}>={
  'south-west':{x:25,y:91,angle:0},south:{x:50,y:91,angle:0},'south-east':{x:75,y:91,angle:0},east:{x:92,y:50,angle:-90},
  'north-east':{x:75,y:9,angle:180},north:{x:50,y:9,angle:180},'north-west':{x:25,y:9,angle:180},west:{x:8,y:50,angle:90}
 };
 const p=poses[seat];return portrait?{x:100-p.y,y:p.x,angle:p.angle+90}:p;
}
