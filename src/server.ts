import { ApplicationCommandType, ComponentType, InteractionResponseType, InteractionType, type APIChatInputApplicationCommandInteraction, type APIInteraction, type APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";

import { RollCommand, RollSettingsCommand } from "./commands.ts";
import { SecureRng } from "./dice.ts";
import { HandleButton, HandleRoll, HandleRollSettings } from "./handlers.ts";
import { LoadSettings, type SettingsStore } from "./settings.ts";


interface Env { DISCORD_PUBLIC_KEY: string; SETTINGS: SettingsStore; }

async function VerifyDiscordRequest(request: Request, env: Env): Promise<APIInteraction | null> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  const isValid = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  return isValid ? (JSON.parse(body) as APIInteraction) : null;
}

async function Respond(interaction: APIInteraction, env: Env): Promise<Response> {
  if (interaction.type === InteractionType.Ping) return Response.json({ type: InteractionResponseType.Pong });

  if (
    interaction.type === InteractionType.ApplicationCommand
    && interaction.data.type === ApplicationCommandType.ChatInput
    && interaction.data.name === RollCommand.name
  ) {
    const settings = await LoadSettings(env.SETTINGS, interaction.guild_id);
    return Response.json(
      HandleRoll(interaction as APIChatInputApplicationCommandInteraction, SecureRng, settings)
    );
  }

  if (
    interaction.type === InteractionType.ApplicationCommand
    && interaction.data.type === ApplicationCommandType.ChatInput
    && interaction.data.name === RollSettingsCommand.name
  ) {
    return Response.json(
      await HandleRollSettings(interaction as APIChatInputApplicationCommandInteraction, env.SETTINGS)
    );
  }

  if (
    interaction.type === InteractionType.MessageComponent
    && interaction.data.component_type === ComponentType.Button
  ) {
    const settings = await LoadSettings(env.SETTINGS, interaction.guild_id);
    return Response.json(
      HandleButton(interaction as APIMessageComponentButtonInteraction, SecureRng, settings)
    );
  }
  return Response.json({ error: "Unknown Type" }, { status: 400 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/") return new Response("Not Found.", { status: 404 });
    if (request.method === "GET") return new Response("burning-wheel-bot is running");
    if (request.method !== "POST") return new Response("Not Found.", { status: 404 });

    const interaction = await VerifyDiscordRequest(request, env);
    if (!interaction) return new Response("Bad request signature.", { status: 401 });

    return Respond(interaction, env);
  }
};
