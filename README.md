# BWBot

A Discord dice bot for Burning Wheel Gold Revised. It rolls a dice pool, counts successes by shade, compares them to an obstacle, and lets the roller spend Fate, Deeds or a call-on trait after the roll with buttons.

![A roll in Discord showing the result, coloured dice and spend buttons](screenshot.png)

## Using the bot

```txt
/roll dice:5 ob:3 shade:grey open:false
```

| Option | Required | Values | Default |
| --- | --- | --- | --- |
| `dice` | Yes | 1-30, including help, FoRKs, advantage and Persona | |
| `ob` | No | 0-30. Ob 0 just reports successes | 0 |
| `shade` | No | Black (4+), Grey (3+), White (2+) | Black |
| `open` | No | `true` makes 6s explode | `false` |

Example result:

```txt
✔ PASS (+0) (Routine test)
5D Grey vs Ob 3 → [⚄, ⚁, ⚃, ⚁, ⚂] = 3 successes
[Fate: explode 6s (disabled)] [Deeds: reroll failures] [Call-on: reroll 1 failure]
```

Successful dice are green and failed dice are red on desktop. An exploded 6 shows as `⚅!`. The test label comes from the book's advancement table, which stops at 18D, so larger pools have no label.

### Spending after the roll

Each button works once per roll, and only for the person who rolled.

| Button | Effect |
| --- | --- |
| Fate | Explodes the 6s. On an open-ended roll, rerolls one failed die instead |
| Deeds | Rerolls all failed dice |
| Call-on | Rerolls one failed die |

Rerolled 6s explode if the roll started open-ended, or after Fate has opened it.

## Host your own

The bot runs on Cloudflare Workers, and the free tier is enough. You need Node.js 24 or newer, a Discord account and a Cloudflare account. Setup takes about 40 minutes.

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/yigitlevent/burning-wheel-bot.git
   cd burning-wheel-bot
   npm install
   ```

2. Copy `.dev.vars.example` to `.dev.vars`.
3. Follow [DEPLOY.md](DEPLOY.md). It covers the Discord app, Cloudflare, deploying, testing and automatic deploys from GitHub Actions.

Your copy needs its own Discord app and its own Terms of Service and Privacy Policy links. If you change how the bot handles data, update [PRIVACY.md](PRIVACY.md) in your copy too.

## Development

| Command | What it does |
| --- | --- |
| `npm test` | Runs the tests in `.tests/` |
| `npm run typecheck` | Checks types |
| `npm run lint` | Runs ESLint |
| `npm run preview -- 8 4 W true` | Prints a sample roll: dice, Ob, shade, open-ended |
| `npm run dev` | Runs the Worker locally |
| `npm run deploy` | Deploys to Cloudflare |
| `npm run register` | Registers `/roll` with Discord |

## License

[MIT](LICENSE). See also the [Terms of Service](TERMS.md) and [Privacy Policy](PRIVACY.md).
