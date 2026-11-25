import type {TableSeat} from '../tabletop/seats';
import type {Soul,SoulSpec} from '../tabletop/rearrangement';
export const angelIds=['zadkiel','raphael','selaphiel','barachiel','chamuel','jophiel','uriel','jegudiel','raguel','haniel','gabriel','michael'] as const;
export type Angel=typeof angelIds[number];
export interface Group {id:string;x:number;y:number;tiles:string[];zone:string|null;slots?:number[];jokerFaces?:Record<string,SoulSpec>}
export const botLevels=['easy','standard','hard'] as const;
export type BotLevel=typeof botLevels[number];
export interface Player {id:string;name:string;bot:boolean;difficulty?:BotLevel;seat?:TableSeat;local?:boolean;options:Angel[];angel:Angel|null;hand:string[];favor:number;opened:boolean;used:boolean;purgatory:string|null;sanctuary:boolean;scales:string[];credit:number;target:string|null;ready:boolean;scores:number[]}
export type Phase='lobby'|'angels'|'judgment'|'play'|'inspect'|'dance'|'after-turn'|'round-end'|'ended';
export interface State {version:1;revision:number;seed:string;owner:string;tabletop?:boolean;chooseOnJoin?:boolean;players:Player[];tiles:Record<string,Soul>;phase:Phase;round:number;starter:number;turn:number;turnNumber:number;bag:string[];heaven:Group[];decrees:number[];judgment:number;idle:number;changed:boolean;inspection:{player:string;tiles:string[]}|null;communion:{player:string;target:string}|null;dance:{count:number;choices:Record<string,string[]>}|null;winner:string|null;lastResult:{winner:string;penalties:Record<string,number>;scores:Record<string,number>;stalemate:boolean}|null;eventIds:string[]}
export type OrganizingPower={kind:'forgive'|'penance';tile:string}|{kind:'transfigure';tiles:string[]}|{kind:'sanctuary';group:string};
export type Command=
 |{type:'create';name:string;seed:string;seat?:TableSeat;chooseOnJoin?:boolean}
 |{type:'join';name:string;seat?:TableSeat}
 |{type:'seat';id:string;name:string;seat:TableSeat}
 |{type:'bot';id:string;name:string;seat?:TableSeat;difficulty?:BotLevel}
 |{type:'start'}
 |{type:'angel';angel:Angel}
 |{type:'judgment-choice';tiles?:string[];target?:string}
 |{type:'rack';tiles:string[]}
 |{type:'organize';groups:Group[];opening?:string[];stage?:Group[];power?:OrganizingPower;communionTile?:string;sanctuary?:string[][][];turn:number}
 |{type:'draw';foretell?:boolean;turn:number}
 |{type:'keep';tile:string;turn:number}
 |{type:'communion';target:string;turn:number}
 |{type:'before';power:'judgment'|'dance'|'calling'|'banish';tiles?:string[];count?:number;rank?:number;target?:string;turn:number}
 |{type:'dance-choice';tiles:string[];turn:number}
 |{type:'continue';zeal?:boolean;turn:number}
 |{type:'next-round'};
export interface GameEvent {version:1|2|3;sequence:number;id:string;actor:string;command:Command}
