# Learned opponents

The current ladder uses the corrected Sanctuary rule: exactly one formation on
creation, then extensions and splits of protected formations, with no independent
formation imports. God’s Poker Night also requires distinct colors within each
pair and triple. New events use rules version 3; historical version-1 and version-2
events remain replayable. The existing frozen weights are requalified under the
new legality check; their training provenance remains unchanged. Previous models are archived under
`models/archive/before-sanctuary-v2/`; their results describe the old rule only.

The difficulty ladder uses complete three-round games. Easy must beat the frozen
heuristic; standard must beat frozen easy; hard must beat frozen standard. A
promotion benchmark uses head-to-head matches against the predecessor, with
all twelve Angels and rotated seats. Multiplayer cohorts remain useful
diagnostics; set `PLAYERS=all` to run them. Ties do not count as wins.

Head-to-head promotion requires at least 80% outright wins overall and an overall
95% Wilson lower bound of at least 80%, balanced across all twelve Angels and both
seats. Each Angel must remain competitive (its 95% lower bound exceeds 50%) and
standard/hard must demonstrate every gift. Per-Angel results remain diagnostic;
the 80% target applies to the overall balanced head-to-head cohort. The report
and model SHA-256 must match before a level can enter `models/registry.json`.
Unqualified candidates stay under ignored `tmp/rl/`; the UI lists only promoted
levels. Old events without a difficulty retain the original heuristic.

## Policy and information

The policy is a learned linear action-value ranking over structured legal plans.
Its weights are fitted with episodic cross-entropy reinforcement learning:
parameter exploration, complete-game returns, elite updates, and development
checkpoint selection. Power preferences also support per-Angel coordinate policy
search with complete-game rewards. These are learned policies with a bounded
planner; they are not neural networks.

Compound Organize plans combine several rack melds and extensions. Bounded exact
cover explores rearrangements while requiring every existing table soul to remain
in a legal formation. The broader levels inspect more formations and search more
nodes. They may rearrange their own sanctuaries and protect added formations;
other players’ protected tiles remain fixed. Power plans cover all twelve Angels,
including Penance and rescue, Communion’s chosen soul, explicit retrieval gifts,
and Zeal after a completed turn.

`observe` is the inference boundary. It exposes only the acting rack, public
Heaven, public scores/Favor/powers/rack counts, the current decree, and permitted
inspection results. Communion reveals only the selected opponent’s hand after
activation. Opponent tile identities, their unchosen Angels, the engine seed,
and bag order never enter observations or features. Uncertain powers use
independently sampled hypothetical hidden tiles conditioned on public counts.
They never sample from the real bag or inspect real hidden racks.

The public engine validates each proposed command. Models run in a browser
worker; the host discards results when the game, revision, animation state, or
controller has changed. Only committed commands enter the existing versioned
event log; replay needs no model execution. Difficulty is recorded on the bot’s
registration event and survives reload.

## Experiments and reproduction

Training and development namespaces are separate from held-out namespaces.
Each training run snapshots its sources before launching rollout workers, so
changes in the working tree cannot alter a running experiment. Opponent JSON
weights are loaded independently and remain frozen. Reports include model and
opponent hashes, runtime source hashes, seed namespace, complete-game results,
seat/player/Angel breakdowns, power-use counts, and confidence intervals.

Examples:

```sh
# Candidates are never promoted by training alone.
LEVEL=easy TRAIN_NAMESPACE=hp-rl-training-easy-new \
  OUTPUT=tmp/rl/easy-new.json bun run rl:train

LEVEL=standard RESUME=models/easy.json OPPONENT=models/easy.json \
  TRAIN_NAMESPACE=hp-rl-training-standard-new \
  OUTPUT=tmp/rl/standard-new.json bun run rl:train

MODEL=tmp/rl/standard-new.json OPPONENT=models/easy.json \
  TRAIN_NAMESPACE=hp-rl-training-powers-standard-new \
  OUTPUT=tmp/rl/standard-powers-new.json bun run rl:train:powers

MODEL=tmp/rl/standard-powers-new.json OPPONENT=models/easy.json \
  EVAL_NAMESPACE=hp-rl-heldout-standard-new GAMES=1200 \
  bun run rl:evaluate

# Refuses a failed report or a changed model.
REPORT=reports/rl/hp-rl-heldout-standard-new.json bun run rl:promote
```

`PLAYERS` defaults to two; `PLAYERS=all` uses the balanced 2–5-player cohort.
`WORKERS` defaults to eight CPU rollout processes. They are separate from browser
workers used during play. Training configuration, warm starts, selected generations,
and development results are saved with the candidate. After tuning in response
to a held-out failure, use a fresh held-out namespace. Never overwrite an earlier
report or count a truncated/invalid game as a win.

`bun test tests/rl.test.ts` covers information masking, legality for every Angel,
all decrees, Communion, Purgatory, sanctuary release, deterministic difficulty,
and legacy behavior. `bun run review:bots` checks worker-driven play, animation
handoff, reload, and tabletop difficulty selection. Firebase emulator tests cover
persistent registration and reject invalid difficulty values.

## Recorded results under corrected Sanctuary and Poker rules

The head-to-head target is the primary promotion test. Earlier full-field and
head-to-head reports describe the rule versions recorded in those reports. Historical and failed
exploratory reports are retained rather than overwritten.

| Level | Frozen opponent | Head-to-head wins | Win rate |
| --- | --- | --- | --- |
| Easy | Original heuristic | 1,169 / 1,200 | 97.42% |
| Standard | Easy | 1,105 / 1,200 | 92.08% |
| Hard | Standard | 1,047 / 1,200 | 87.25% |

The current reports use the namespace `hp-rl-heldout-<level>-poker-v3`.
Standard and hard exercised every gift. Reports include each Angel separately; the overall
balanced win rate is the promotion target, rather than an 80% claim for each
Angel or against a multiplayer field.

Replacing model weights requires an explicit `MODEL_GENERATION` archive directory
(for example, `before-sanctuary-v2`). It preserves the old model bytes and
qualification before installing the newly qualified candidate. Requalifying the
same frozen model only updates its qualification; historical reports remain intact.
Never apply an earlier rule generation's performance claim to a changed engine.

Hard's overall 95% Wilson interval is 85.24–89.02%. Its breakdown against
corrected-rule standard is below. Each Angel has 100 complete three-round games;
activations are counts across 300 rounds, rather than a measure of the benefit
caused by using a gift.

| Angel | Gift | Wins / 100 | Activations |
| --- | --- | --- | --- |
| Michael | Banishment | 96 | 209 |
| Raguel | Judgment | 94 | 285 |
| Chamuel | Communion | 93 | 287 |
| Jegudiel | Zeal | 92 | 299 |
| Raphael | Penance | 88 | 216 |
| Zadkiel | Forgiveness | 87 | 294 |
| Selaphiel | Sanctuary of Choirs | 87 | 295 |
| Jophiel | Transfiguration | 84 | 63 |
| Uriel | Foretelling | 84 | 286 |
| Barachiel | Sanctuary of Processions | 83 | 297 |
| Gabriel | Calling | 81 | 279 |
| Haniel | Heavenly Dance | 78 | 240 |
