# Burning Wheel Gold Revised — Discord Dice Bot Plan

## Goal

A Discord bot that rolls BWG dice pools: counts successes by shade, compares against an obstacle, and lets the roller spend Fate / Deeds / call-on traits **after** the roll via buttons.

## Stack

- **Hosting:** Cloudflare Workers (free tier: 100k requests/day, never sleeps)
- **Discord integration:** HTTP interactions (Discord POSTs slash commands and button clicks to the Worker). No gateway connection, no discord.js.
- **Language:** TypeScript
- **Starting point:** fresh TypeScript project. Only the signature check is copied from https://github.com/discord/cloudflare-sample-app, which is JavaScript.
- **Storage:** none. Roll state lives in each button's `custom_id`.

## Rules to implement

| BWG rule | Bot behavior |
|---|---|
| Shade: Black / Grey / White | Die succeeds on 4+ / 3+ / 2+ |
| Obstacle (Ob) | Pass if successes ≥ Ob; show margin |
| Ob 0 (graduated test) | Just report successes |
| Help, FoRKs, advantage, Persona | Extra dice added to the pool before rolling (user adds them into `dice`) |
| Open-ended | 6s explode: reroll, add successes, repeat while 6s come up |
| Fate (post-roll) | Open-end the 6s of a non-open-ended roll. On an already open-ended roll, reroll one failed die (verify against the book) |
| Deeds (post-roll) | Reroll all failed dice (traitors) |
| Call-on trait (post-roll) | Reroll one failed die |
| Rerolled 6s | Explode if the roll is open: it started open-ended, or Fate has open-ended it |
| Advancement | Label test Routine / Difficult / Challenging from pool size vs Ob |

**Verify against the book:** copy the Routine / Difficult / Challenging table from the BWG advancement section into code. Do not trust memory for the thresholds. Until then the label is left out.

## Command

```
/roll dice:<int> ob:<int> shade:<black|grey|white> open:<bool>
```

`dice` is required (1-30). Defaults: `ob` 0 (0-30), `shade` black, `open` false.

Optional later: `note:<string>` (what the roll is for), `vs` tests.

## Output

```
🎲 5D Grey vs Ob 3 → [6, 4, 3, 2, 1] = 3 successes ✅ PASS (Difficult test)
[Fate: explode 6s] [Deeds: reroll failures] [Call-on: reroll 1 failure]
```

- Buttons only work for the user who rolled (check `interaction.member?.user.id ?? interaction.user?.id`, because DMs have no `member`).
- After a button is used, disable it (each can be spent once per roll).
- Clicking a button **edits the original message** with the new result and a line saying what was spent.

## Button state in `custom_id`

Max 100 characters. Format:

```
<action>:<userId>:<shade>:<ob>:<pool>:<flags>:<dice>
fate:123456789012345678:G:3:5:1:x4321
```

- `action`: `fate` | `deeds` | `callon`
- `shade`: `B` | `G` | `W`
- `pool`: original dice count, used for the advancement label
- `flags`: one hex digit: open=1, fate=2, deeds=4, callon=8
- `dice`: one character per die: `1`-`6`, or `x` for a 6 that has already exploded

The 30-die cap leaves room for about 35 explosions. If the id still passes 100 characters, the message shows the result without buttons. No KV.

With no storage, a fast double click can apply two clicks to the same old state. This is accepted.

## File layout

```
src/
  dice.ts        rollPool, explode, rerollFailures, rerollOne, countSuccesses
  dice.test.ts   unit tests with a seeded/stubbed RNG
  advancement.ts test difficulty table
  format.ts      result message + button rows
  handlers.ts    /roll and button logic
  state.ts       encode/decode custom_id
  server.ts      Worker entry: verify signature, route to handlers
  commands.ts    slash command definition
  register.ts    one-off script to register commands with Discord
```

## Steps

1. **Discord app** (~10 min): create the app at https://discord.com/developers/applications. Copy the public key, app ID and bot token. Invite the bot to your server with the `applications.commands` scope.
2. **Cloudflare account** (~5 min): sign up at https://dash.cloudflare.com.
3. **Scaffold** (~15 min): clone the sample app, `npm install`, put the secrets in with `npx wrangler secret put`.
4. **Dice logic + tests** (~30 min): `dice.ts`, `advancement.ts`, `dice.test.ts`.
5. **Command + formatting** (~45 min): `/roll` handler, `format.ts`.
6. **Buttons** (~45 min): `state.ts`, button handler, owner check, disable used buttons.
7. **Deploy** (~10 min): `npx wrangler deploy`, paste the Worker URL into **Interactions Endpoint URL** in the Discord developer portal, run `register.ts`.
8. **Test in Discord**: roll each shade, open-ended, and each button.

**Total:** about 3 hours.

## Later ideas

- Versus tests (two rollers, compare successes)
- `note` field and per-channel roll log
- Beginner's Luck toggle (doubles Ob, notes the skill being learned)
- Artha tracking per character (needs KV or D1)
