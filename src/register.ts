import process from "node:process";

import { DieOfFateCommand, RollCommand, RollSettingsCommand } from "./commands.ts";


const DiscordToken = process.env.DISCORD_TOKEN;
const ApplicationId = process.env.DISCORD_APPLICATION_ID;

if (!DiscordToken) {
  throw new Error("The DISCORD_TOKEN environment variable is required.");
}
if (!ApplicationId) {
  throw new Error("The DISCORD_APPLICATION_ID environment variable is required.");
}

const Response = await fetch(`https://discord.com/api/v10/applications/${ApplicationId}/commands`, {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bot ${DiscordToken}`
  },
  method: "PUT",
  body: JSON.stringify([RollCommand, DieOfFateCommand, RollSettingsCommand])
});

if (!Response.ok) {
  throw new Error(
    `Error registering commands: ${Response.status} ${Response.statusText}\n${await Response.text()}`
  );
}

console.log("Registered all commands");
