import { ApplicationCommandType, ComponentType, InteractionResponseType, InteractionType, type APIChatInputApplicationCommandInteraction, type APIInteraction, type APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";

import { RollCommand } from "./commands.ts";
import { SecureRng } from "./dice.ts";
import { HandleButton, HandleRoll } from "./handlers.ts";


interface Env { DISCORD_PUBLIC_KEY: string; }

async function VerifyDiscordRequest(request: Request, env: Env): Promise<APIInteraction | null> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  const isValid = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  return isValid ? (JSON.parse(body) as APIInteraction) : null;
}

function Respond(interaction: APIInteraction): Response {
  if (interaction.type === InteractionType.Ping) return Response.json({ type: InteractionResponseType.Pong });

  if (
    interaction.type === InteractionType.ApplicationCommand
    && interaction.data.type === ApplicationCommandType.ChatInput
    && interaction.data.name === RollCommand.name
  ) {
    return Response.json(
      HandleRoll(interaction as APIChatInputApplicationCommandInteraction, SecureRng)
    );
  }

  if (
    interaction.type === InteractionType.MessageComponent
    && interaction.data.component_type === ComponentType.Button
  ) {
    return Response.json(
      HandleButton(interaction as APIMessageComponentButtonInteraction, SecureRng)
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

    return Respond(interaction);
  }
};
