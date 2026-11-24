import{v as ne,k as ae,M as te,aW as re,h as H,I as oe,a5 as z,F as I,x as J,G as ie,y as se,p as le,t as l,a as de,c as w,r as k,s as i,f as ue,o as y}from"./Bm9GPh-W.js";import{a as d,f as c}from"./B466leYZ.js";import{s as g}from"./BIy-W4Wa.js";import{p as Y,i as b}from"./Cn_W2R4N.js";import{c as ce,s as u}from"./CjjBZK77.js";import{b as C}from"./BrKEcfhd.js";function je(p,e){let s=null,t=H;var n;if(H){s=ie;for(var r=se(document.head);r!==null&&(r.nodeType!==oe||r.data!==p);)r=z(r);if(r===null)I(!1);else{var P=z(r);r.remove(),J(P)}}H||(n=document.head.appendChild(ne()));try{ae(()=>{var h=te(()=>e(n));h.f|=re,H||(h.nodes===null?h.nodes={start:n,end:n,a:null,t:null}:h.nodes.end=n)})}finally{t&&(I(!0),J(s))}}const he=[{id:"zadkiel",name:"Zadkiel",title:"Forgiveness",detailed:`During your Organize action, take one unprotected soul from Heaven into your
hand. You may contribute other souls and rearrange Heaven during that action.
You may also replay the retrieved soul in the same action; that delivery earns
Favor normally, with no retrieval cost.
The final formations must be legal. Taking the soul is permitted even if you
contribute no souls. Retrieval costs no Favor, including when you also deliver
other souls during the action. The retrieved soul earns Favor normally if played
on the same or a later turn.`,kind:"angel"},{id:"raphael",name:"Raphael",title:"Penance",detailed:`During your Organize action, remove one unprotected soul from Heaven into your
Purgatory. You may play hand souls and rearrange Heaven as part of this same
action, including before and after moving the soul into Purgatory. Finish Heaven
legally. Activating Penance consumes the power for the round.

For example, play your remaining hand into Heaven, move one excess table soul
into Purgatory to make the remaining formations legal, and finish the action.
Your hand is empty, so you go out even though Purgatory is occupied.

If the round continues, then on later turns while Purgatory is occupied your
ordinary action is either to rescue that soul into a legal **Procession** or to
draw. You may rearrange unprotected Heaven to rescue it. Once rescued, the
restriction ends immediately: you may also play hand souls in that same Organize
action. A failed rescue is restored and followed by a draw. The soul stays in
Purgatory until rescued; it may not move to your hand or another player. An
unrecovered soul counts in your penalty if another player goes out, but never
prevents your own empty-hand finish. Its Favor treatment is in section 5.`,kind:"angel"},{id:"selaphiel",name:"Selaphiel",title:"Sanctuary of Choirs",detailed:`During your Organize action, move one complete legal Choir from shared Heaven
into your visible Sanctuary. This may be a Choir completed during that action.
Only you may move, add to, split, or rearrange protected tiles; any formations
remaining in your Sanctuary must be legal Choirs. You may rearrange them together
with unprotected Heaven on your turns. Moving them into your hand still requires
a power that explicitly permits retrieval.

Your Sanctuary is a special physical region on the table. All tiles currently
inside it are protected, including tiles you add from your hand or shared Heaven.
Only you may rearrange or extend it, and all formations remaining inside must be
legal Choirs at the end of the action.

You may move tiles out into shared Heaven during your Organize action. They are
then available to everyone; protection is determined solely by current location,
with no permanent released status or original-tile records. For example, from a
four-tile Choir you may leave three safely inside Sanctuary and use the fourth
in shared Heaven. If the Sanctuary is empty when your Organize action finishes,
its once-per-round protection ends: remove its region marker, and do not establish another Sanctuary
that round. While it remains occupied, you may add tiles and rearrange its
contents freely. You may temporarily empty it while rearranging within one
action, provided it contains legal formations when that action ends. Once closed,
you cannot establish another Sanctuary that round.`,kind:"angel"},{id:"barachiel",name:"Barachiel",title:"Sanctuary of Processions",detailed:"Use Selaphiel's rules, replacing **Choir** with **Procession** throughout.",kind:"angel"},{id:"chamuel",name:"Chamuel",title:"Communion",detailed:`During your Organize action, choose an opponent. Privately look at their entire
hand, including any Scales commitments, and choose one soul. Keep any Scales
commitments in their separate group while inspecting the hand. Reveal your chosen
soul. You may deliver it directly into Heaven provided you also deliver at least
one soul from your own hand in that action. You cannot keep the chosen soul in
your hand. If you decline or cannot use it, return it to its owner and finish a
normal Organize action or draw instead.
The power is spent once you look at the opponent's hand, even if no soul is
played. If the Organize attempt is rolled back, return the chosen soul but keep
the power spent.`,kind:"angel"},{id:"jophiel",name:"Jophiel",title:"Transfiguration",detailed:`During your Organize action, take exactly two unprotected souls from Heaven into
your hand and deliver at least two souls that were in your hand before the
action. The two retrieved souls must remain in your hand until this action ends;
they cannot satisfy the delivery requirement. Other rearrangement and additional
contributions are allowed. Finish Heaven legally and apply net Favor.`,kind:"angel"},{id:"uriel",name:"Uriel",title:"Foretelling",detailed:`When taking an ordinary Draw action, inspect up to eight random bag souls,
choose one, and return the rest. This replaces Favor selection for that draw.
The draw ends your turn. You cannot activate this with an empty bag.`,kind:"angel"},{id:"jegudiel",name:"Jegudiel",title:"Zeal",detailed:`After completing your turn, immediately take one additional full turn, provided
the round has not ended. Spend the power before starting that extra turn. Then
play passes to the next player clockwise. Zeal can follow a Draw action.`,kind:"angel"},{id:"raguel",name:"Raguel",title:"Judgment",detailed:`Before your ordinary action, return any positive number K of hand souls to the
bag, mix, then blindly draw **2K** souls. Returned souls can be redrawn. Choose K
only if the bag will contain at least 2K souls after the return. Finish the whole
exchange before checking for an empty hand. Then take your ordinary action.`,kind:"angel"},{id:"haniel",name:"Haniel",title:"The Heavenly Dance",detailed:`Before your ordinary action, choose a positive integer X no greater than the
smallest current hand size. Each player privately selects X hand souls, then all
pass them simultaneously to the player on their right (counterclockwise).
Selections must be fixed before anyone sees incoming souls. Finish all transfers
before checking for an empty hand. Then take your ordinary action. Purgatory and
Sanctuary souls cannot be passed. You cannot activate the power if X would be zero.`,kind:"angel"},{id:"gabriel",name:"Gabriel",title:"Calling",detailed:`Before your ordinary action, name one rank from 1 through 13. All opponents give
you every hand soul of that rank. They must comply honestly; their other souls
remain private. You need not hold the rank and may call one nobody holds, spending
the power. Jokers and souls in Sanctuary or Purgatory are not affected. Scales
commitments on a rack are hand souls and must be given if their rank is called.
Check for anyone going out after all transfers; if the round continues, take your
ordinary action.`,kind:"angel"},{id:"michael",name:"Michael",title:"Banishment",detailed:`Before your ordinary action, choose a rank from 1 through 13 represented in your
hand and one opponent. Give them **all** your hand souls of that rank. Jokers
cannot be included. This may empty your hand and end the round immediately;
otherwise take your ordinary action.`,kind:"angel"}],me=[{id:"decree-1",name:"Even and Odd",title:"Heavenly Decree",detailed:"Processions advance by exactly 2 each step, in one color, with at least 3 souls. No wrapping. Example: red 2–4–6–8. Ordinary step-1 Processions are not legal.",kind:"decree"},{id:"decree-2",name:"All Are Welcome",title:"Heavenly Decree",detailed:"Choirs still contain exactly 3 or 4 same-rank souls, but colors may repeat.",kind:"decree"},{id:"decree-3",name:"Colorful Processions",title:"Heavenly Decree",detailed:"Processions use consecutive ascending ranks in any colors, with at least 3 souls. No wrapping.",kind:"decree"},{id:"decree-4",name:"Candy Cane",title:"Heavenly Decree",detailed:"Processions use consecutive ascending ranks and alternate exactly two different colors, with at least 3 souls. No wrapping. Example: red 4, blue 5, red 6. Single-color Processions are not legal.",kind:"decree"},{id:"decree-5",name:"The Eternal Circle",title:"Heavenly Decree",detailed:"Same-color Processions may cross 13→1, with at least 3 and at most 13 souls. No rank may repeat within one Procession. Example: blue 12–13–1–2. Nonwrapping Processions remain legal.",kind:"decree"},{id:"decree-6",name:"God's Poker Night",title:"Heavenly Decree",detailed:"Ordinary Choirs and Processions remain legal. Also permit **Two Pair** (exactly 2 souls of each of two distinct ranks) and **Full House** (exactly 3 of one rank and 2 of a different rank). Colors may repeat in these added formations. They are neither Choirs nor Processions for powers.",kind:"decree"},{id:"decree-7",name:"The Grand Procession",title:"Heavenly Decree",detailed:"Processions require at least 4 souls, with ordinary color and consecutive-rank rules.",kind:"decree"},{id:"decree-8",name:"Stairway to Heaven",title:"Heavenly Decree",detailed:"Same-color Processions advance by 1 or 2 at each step, independently, with at least 3 souls. Ranks strictly increase; no wrapping. Example: red 3–5–6–8.",kind:"decree"},{id:"decree-9",name:"Heavenly Pairs",title:"Heavenly Decree",detailed:"Choirs may contain 2, 3, or 4 same-rank souls, all different colors.",kind:"decree"},{id:"decree-10",name:"Mirror Choir",title:"Heavenly Decree",detailed:"A Choir is exactly **2 souls of the same color**, with **different ranks totaling 14**: 1+13, 2+12, 3+11, 4+10, 5+9, or 6+8. Ordinary same-rank Choirs and 7+7 are not legal Choirs. Processions are unchanged.",kind:"decree"}],ye=[{id:"judgment-1",name:"Divine Retribution",title:"Final Judgment",detailed:`If a player who is not a Favorite wins the round, double every Favorite's
undelivered penalty before calculating scores. If any Favorite wins, penalties
are normal. The winner receives the increased penalties as part of their award.
In a stalemate, first choose the stalemate winner
using undoubled penalties, then apply doubling if that winner is not a Favorite;
do not choose the winner again.`,kind:"judgment"},{id:"judgment-2",name:"Shared Sins",title:"Final Judgment",detailed:`After seeing their starting hand but before the first turn, each player secretly
writes down one other player. Reveal all selections at round end. Each receives
an independent credit equal to their selected player's penalty loss for the
round, before Shared Sins credits. Selecting the round winner earns zero. Several
players may select the same person. Credits do not reduce anyone else's loss or
increase the round winner's ordinary award.`,kind:"judgment"},{id:"judgment-3",name:"The Scales of Justice",title:"Final Judgment",detailed:`After the deal and before the first turn, each player may set aside **0–5
numbered souls** in a separate area of their own rack. These are their committed
souls and remain part of their hand. Their separate position identifies them;
no tile markers or records of individual tile identities are needed. Jokers
cannot be committed.

As soon as a committed soul is introduced into Heaven in a successfully completed
legal action, its owner earns a credit equal to its printed rank. Record that
credit on the scoresheet immediately: it is final. The delivered soul then
becomes an ordinary table soul. Later rearrangement, retrieval, or transfer never
erases the credit and never makes that soul committed again. Ordinary Heaven and
Sanctuary both qualify as delivery.

Committed souls still set aside on the owner's rack at round end incur **triple**
their normal penalty, replacing the ordinary single penalty. Personal delivery
credits do not increase the winner's ordinary award; tripled penalties do.

**Transfers:** If a power moves a still-committed soul out of its
owner's hand without delivering it into Heaven, its commitment ends. It earns no
credit and becomes an ordinary soul in its destination. Thus Calling, Banishment,
Heavenly Dance, or Judgment require no continuing ownership or identity tracking.
If Communion delivers a committed soul directly from its owner's rack into Heaven,
the owner receives the permanent credit, while Chamuel receives ordinary Favor
for the delivery. Afterward the soul is ordinary, as with any committed delivery.`,kind:"judgment"},{id:"judgment-4",name:"Divine Favor Head Start",title:"Final Judgment",detailed:`Set each player's initial Favor to the number of players with a **strictly higher
cumulative score**: first place gets 0, an untied second gets 1, and so on. Tied
players receive the same head start. Continue earning and spending Favor normally.`,kind:"judgment"},{id:"judgment-5",name:"Redemption",title:"Final Judgment",detailed:`After normal round-three scoring, the round winner replaces their single most
negative round-one or round-two score with zero. If the two negative scores are
equal, erase round one's. If neither is negative, there is no benefit. Recompute
that player's cumulative score; no other player's past score changes.`,kind:"judgment"}],f={angels:he,decrees:me,judgments:ye},F={zadkiel:["During Organize","Take one soul from Heaven into your hand."],raphael:["During Organize","Set one soul from Heaven in Purgatory. On your next turn, rescue it into a procession. If you cannot, you must draw instead."],selaphiel:["During Organize","Shelter a Choir in your Sanctuary. Only you may rearrange it."],barachiel:["During Organize","Shelter a Procession in your Sanctuary. Only you may rearrange it."],chamuel:["During Organize","Look at an opponent’s whole hand. Choose a soul to play into Heaven with at least one of your own, or return it."],jophiel:["During Organize","Swap two souls in Heaven for at least two from your hand."],uriel:["When drawing","Look at eight souls from the bag. Keep one and return the rest."],jegudiel:["After your turn","Take another turn."],raguel:["Before your action","Return any number of souls to the bag, mix, and then draw double that number."],haniel:["Before your action","Choose how many souls to pass, up to the smallest hand. Everyone passes that many souls to the right."],gabriel:["Before your action","Name a rank. Every opponent gives you all their souls of that rank."],michael:["Before your action","Give all your souls of one rank to an opponent."],"decree-1":["Rounds one & two","Processions climb by twos: 1–3–5 or 2–4–6."],"decree-2":["Rounds one & two","Choirs may repeat colors."],"decree-3":["Rounds one & two","Processions may mix colors."],"decree-4":["Rounds one & two","Processions alternate between two colors."],"decree-5":["Rounds one & two","Processions may wrap from 13 back to 1."],"decree-6":["Rounds one & two","Also allow two pairs (2+2) and full houses (3+2)."],"decree-7":["Rounds one & two","Processions need at least four souls."],"decree-8":["Rounds one & two","Processions may climb one or two ranks at each step."],"decree-9":["Rounds one & two","Two same-rank souls of different colors make a Choir."],"decree-10":["Rounds one & two","Make a Choir from two souls of one color with different ranks adding up to 14."],"judgment-1":["Round three","If someone other than God’s Favorite wins the round, double the Favorite’s penalty."],"judgment-2":["Round three","Secretly choose another player. At round end, gain a credit equal to their penalty."],"judgment-3":["Round three","Set aside up to five souls. Each earns its rank in permanent points when delivered; any left cost triple."],"judgment-4":["Round three","Start with one Favor for each player ahead of you in the standings."],"judgment-5":["Round three","Win this round to erase your worst score from an earlier round."]};function _(p,e,s){return p.map((t,n)=>{if(!F[t.id])throw new Error(`Missing brief text: ${t.id}`);return{...t,kind:t.kind,timing:F[t.id][0],brief:F[t.id][1],code:`HP-${e}${String(n+1).padStart(2,"0")}`,number:s+n+1}})}const ge=_(f.angels,"A",0),fe=_(f.decrees,"D",f.angels.length),pe=_(f.judgments,"J",f.angels.length+f.decrees.length),ve=[...ge,...fe,...pe],we=ve.length,Ae={angel:"Angels",decree:"Heavenly Decrees",judgment:"Final Judgments"};var ke=c('<img class="back-art" data-layer="artwork" alt="" draggable="false"/>'),be=c('<img class="background-layer" data-layer="background" alt="" draggable="false"/>'),He=c('<img class="subject-layer" data-layer="illustration" alt="" draggable="false"/>'),Ce=c("<h4> </h4>"),Pe=c('<img class="frame-layer" data-layer="frame" alt="" draggable="false"/>'),Se=c('<div class="paper-layer" data-layer="paper"></div> <!> <!> <div class="card-lettering" data-layer="typography"><header data-fit="title"><span> </span><h3> </h3></header> <div class="copy-panel" data-fit="copy"><!><p class="timing"> </p><p class="effect"> </p></div> <footer><span>Higher Powers</span><span> </span></footer></div> <!>',1),Te=c("<article><!></article>");function Ee(p,e){le(e,!0);let s=Y(e,"back",3,!1),t=Y(e,"mono",3,!1);var n=Te();let r;var P=w(n);{var h=m=>{var v=ke();l(()=>u(v,"src",`${C}/art/cards/back-${e.card.kind}.webp`)),d(m,v)},N=m=>{var v=Se(),D=i(ue(v),2);{var B=a=>{var o=be();l(()=>u(o,"src",`${C}/art/cards/heaven-background.webp`)),d(a,o)};b(D,a=>{t()||a(B)})}var O=i(D,2);{var G=a=>{var o=He();l(()=>u(o,"src",`${C}/art/cards/${e.card.id}.webp`)),d(a,o)};b(O,a=>{t()||a(G)})}var S=i(O,2),T=w(S),R=w(T),q=y(R,!0),M=i(R),K=y(M,!0);k(T);var x=i(T,2),j=w(x);{var L=a=>{var o=Ce(),ee=y(o,!0);l(()=>g(ee,e.card.title)),d(a,o)};b(j,a=>{e.card.kind==="angel"&&a(L)})}var A=i(j),W=y(A,!0),U=i(A),X=y(U,!0);k(x);var E=i(x,2),Z=i(w(E)),V=y(Z);k(E),k(S);var Q=i(S,2);{var $=a=>{var o=Pe();l(()=>u(o,"src",`${C}/art/cards/frame.webp`)),d(a,o)};b(Q,a=>{t()||a($)})}l(()=>{g(q,e.card.kind==="angel"?"ANGEL":e.card.kind==="decree"?"HEAVENLY DECREE":"FINAL JUDGMENT"),g(K,e.card.name),g(W,e.card.timing),g(X,e.card.brief),g(V,`${e.card.code??""} · ${e.card.number??""} of ${we??""}`)}),d(m,v)};b(P,m=>{s()?m(h):m(N,-1)})}k(n),l(()=>{r=ce(n,1,"game-card",null,r,{back:s(),mono:t(),dense:e.card.brief.length>310}),u(n,"data-card-id",e.card.id),u(n,"data-kind",e.card.kind),u(n,"aria-label",s()?`${e.card.kind} card back`:e.card.name)}),d(p,n),de()}export{Ee as G,ve as a,ge as b,fe as d,je as h,pe as j,Ae as k};
