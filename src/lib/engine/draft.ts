import {formation,resolveJokers} from './formations';
import {jokerFacesFor,type TileGroup} from '../tabletop/rearrangement';

/** Repair UI bookkeeping only: keep each declaration with its physical joker.
 * A changed formation can give that joker a new legal identity. Inventory,
 * ownership, opening and delivery requirements still go through the reducer.
 */
export function normalizeDraftGroup(group:TileGroup,decree=0):TileGroup {
 const scoped=jokerFacesFor(group.tiles,group.jokerFaces);
 const legal=formation(group.tiles,decree);
 const faces=legal?(formation(group.tiles,decree,scoped)?resolveJokers(group.tiles,decree,scoped):resolveJokers(group.tiles,decree)):scoped;
 return {...group,jokerFaces:faces&&Object.keys(faces).length?faces:undefined};
}
