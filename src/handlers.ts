import { ApplicationCommandOptionType, InteractionResponseType, MessageFlags, type APIApplicationCommandInteractionDataOption, type APIChatInputApplicationCommandInteraction, type APIInteractionResponse, type APIMessageComponentButtonInteraction, type InteractionType } from "discord-api-types/v10";

import { Explode, RerollFailures, RerollOne, RollPool, type Rng, type Shade } from "./dice.ts";
import { Buttons, ResultLine } from "./format.ts";
import { DecodeState, type Action, type RollState } from "./state.ts";


function ActorId(interaction: { member?: { user: { id: string; }; }; user?: { id: string; }; }): string {
  const user = interaction.member?.user ?? interaction.user;
  if (!user) throw new Error("Interaction has no user");

  return user.id;
}

function Ephemeral(content: string): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content, flags: MessageFlags.Ephemeral }
  };
}

function Option(options: APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand>[], name: string): number | string | boolean | undefined {
  const found = options.find(candidate => candidate.name === name);
  switch (found?.type) {
    case ApplicationCommandOptionType.Integer:
    case ApplicationCommandOptionType.String:
    case ApplicationCommandOptionType.Boolean:
      return found.value;
    default:
      return undefined;
  }
}

export function HandleRoll(interaction: APIChatInputApplicationCommandInteraction, rng: Rng): APIInteractionResponse {
  const options = interaction.data.options ?? [];
  const pool = Option(options, "dice") as number;
  const open = (Option(options, "open") as boolean | undefined) ?? false;

  const state: RollState = {
    userId: ActorId(interaction),
    shade: (Option(options, "shade") as Shade | undefined) ?? "B",
    ob: (Option(options, "ob") as number | undefined) ?? 0,
    pool,
    open,
    fate: false,
    deeds: false,
    callon: false,
    dice: RollPool(pool, open, rng)
  };

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: ResultLine(state),
      components: Buttons(state),
      allowed_mentions: { parse: [] }
    }
  };
}

function Spend(action: Action, state: RollState, rng: Rng): { next: RollState; spent: string; } {
  const spentState = { ...state, [action]: true };
  const exploding = spentState.open || spentState.fate;
  const { dice, shade } = state;
  switch (action) {
    case "fate":
      return state.open
        ? {
          next: { ...spentState, dice: RerollOne(dice, shade, exploding, rng) },
          spent: "Spent Fate: rerolled 1 failure"
        }
        : {
          next: { ...spentState, dice: Explode(dice, rng) },
          spent: "Spent Fate: exploded 6s"
        };
    case "deeds":
      return {
        next: { ...spentState, dice: RerollFailures(dice, shade, exploding, rng) },
        spent: "Spent Deeds: rerolled all failures"
      };
    case "callon":
      return {
        next: { ...spentState, dice: RerollOne(dice, shade, exploding, rng) },
        spent: "Spent Call-on: rerolled 1 failure"
      };
  }
}

export function HandleButton(interaction: APIMessageComponentButtonInteraction, rng: Rng): APIInteractionResponse {
  const decoded = DecodeState(interaction.data.custom_id);
  if (!decoded) return Ephemeral("This roll could not be read.");

  const { action, state } = decoded;
  if (ActorId(interaction) !== state.userId) {
    return Ephemeral("Only the roller can spend on this roll.");
  }
  if (state[action]) return Ephemeral("That was already spent on this roll.");

  const { next, spent } = Spend(action, state, rng);
  const earlierSpends = interaction.message.content.split("\n").slice(1);
  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      content: [ResultLine(next), ...earlierSpends, spent].join("\n"),
      components: Buttons(next),
      allowed_mentions: { parse: [] }
    }
  };
}
