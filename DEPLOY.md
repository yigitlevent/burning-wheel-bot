# Deploying the bot

The whole guide takes about 40 minutes.

Secrets go only in `.dev.vars` or the wrangler prompt. `.dev.vars` is gitignored.

## 1. Accounts and invite (about 15 minutes)

### Discord app

1. Open <https://discord.com/developers/applications> and click **New Application**. Name it, for example, Burning Wheel Dice.
2. On **General Information**, copy the **Application ID** and **Public Key**.
3. On the **Bot** tab, click **Reset Token** and copy the token. Discord shows it only once.
4. Create `.dev.vars` in the project root:

   ```txt
   DISCORD_TOKEN=paste_token_here
   DISCORD_APPLICATION_ID=paste_app_id_here
   ```

### Invite to your server

1. On the **Installation** tab, keep **Guild Install** checked and set Install Link to **Discord Provided Link**.
2. Under **Default Install Settings > Guild Install**, add the scopes `applications.commands` and `bot`, with no permissions. The `bot` scope is there so you can DM the bot for the last Discord check.
3. Click **Save Changes**.
4. Open the install link in your browser and choose your server.

### Cloudflare

1. Sign up at <https://dash.cloudflare.com> and verify your email.
2. Run `npx wrangler login` and approve it in the browser.

## 2. Deploy (about 10 minutes)

1. Run `npx wrangler kv namespace create burning-wheel-bot-settings`.
2. Copy the `id` it prints into the `[[kv_namespaces]]` entry in `wrangler.toml`, replacing the one there. Keep `binding = "SETTINGS"`.
3. Run `npm run deploy`. If it asks for a workers.dev subdomain, pick any name.
4. Copy the URL it prints, which looks like `https://burning-wheel-bot.<subdomain>.workers.dev`.
5. Open that URL in your browser. You should see `burning-wheel-bot is running`.
6. Run `npx wrangler secret put DISCORD_PUBLIC_KEY`, and paste the Public Key when asked.
7. In the Discord portal, go to **General Information**, paste the URL into **Interactions Endpoint URL** and click **Save Changes**. Discord tests the URL when you save.
8. Run `npm run register`. You should see `Registered all commands`.

## 3. Test in Discord (about 15 minutes)

Press `Ctrl+R` in Discord if `/roll` doesn't appear yet.

| Test | Expected result |
| --- | --- |
| `/roll dice:5 ob:3 shade:black`, then `grey`, then `white` | Successes on 4+ / 3+ / 2+, with pass or fail and a Routine or Difficult label |
| `/roll dice:5` | Successes only, with no pass or fail |
| `/roll dice:10 ob:3 shade:grey open:true`, then click Fate | Button says "Fate: reroll 1 failure", and one failure rerolls |
| `/roll dice:10 ob:3 shade:grey` until a 6 shows, click Fate, then Deeds | 6s become `6!`, new dice are added, and any 6 from the reroll also explodes |
| `/roll dice:5 ob:3 beginners-luck:true`, then `ob:4` | Ob 6 counts toward learning the skill, and Ob 8 counts toward the root stat |
| `/roll dice:5 ob:3 beginners-luck:true disadvantage:1`, then click a button | Ob 7 counts toward the root stat, and stays that way after the spend |
| Click a button from a second account | Only that account sees "Only the roller can spend on this roll." |
| DM the bot and run `/roll dice:5` | Roll and buttons work |
| `/roll-settings dice-emojis` with six of the server's emojis, wait a minute, then `/roll dice:5` | Dice show as emojis, and stay emojis after a spend |
| `/roll-settings delete`, wait a minute, then `/roll dice:5` | Dice show as numbers, with successes in bold |
| Run `/roll-settings` as a member without Manage Server | The command isn't listed |

To open the DM, click the bot's name in your server's member list and send a message.

## 4. Automatic deploys (about 10 minutes)

Every push to `main` runs lint, the typecheck and the tests, then deploys if they all pass. The workflow is in `.github/workflows/deploy.yml`.

1. In the Cloudflare dashboard, go to **My Profile > API Tokens > Create Token** and use the **Edit Cloudflare Workers** template. Copy the token.
2. Copy your **Account ID** from the Workers & Pages overview page.
3. In the GitHub repo, go to **Settings > Secrets and variables > Actions**. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The workflow does not register commands. If you change `src/commands.ts`, run `npm run register` yourself once the deploy has finished. The `DISCORD_PUBLIC_KEY` secret and the settings stored in KV stay in Cloudflare and are kept across deploys.

## If something fails

- **Endpoint URL won't save:** the Public Key secret is wrong or missing. Repeat step 6 of the Deploy section, then save again.
- **`npm run register` gives a 401:** the token in `.dev.vars` is wrong. Reset it on the **Bot** tab and paste it again.
- **`/roll` says the application did not respond:** run `npx wrangler tail`, roll again, and read the error it prints.
