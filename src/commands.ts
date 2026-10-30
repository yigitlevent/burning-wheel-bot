import { ApplicationCommandOptionType, ApplicationCommandType, type RESTPutAPIApplicationCommandsJSONBody } from "discord-api-types/v10";


export const RollCommand = {
  name: "roll",
  description: "Roll a Burning Wheel dice pool",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "dice",
      description: "Dice in the pool, including help, FoRKs, advantage and Persona",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      min_value: 1,
      max_value: 30
    },
    {
      name: "ob",
      description: "Obstacle. Leave at 0 for a graduated test",
      type: ApplicationCommandOptionType.Integer,
      min_value: 0,
      max_value: 30
    },
    {
      name: "shade",
      description: "Shade of the pool. Defaults to Black",
      type: ApplicationCommandOptionType.String,
      choices: [
        { name: "Black", value: "B" },
        { name: "Grey", value: "G" },
        { name: "White", value: "W" }
      ]
    },
    {
      name: "open",
      description: "Open-ended: 6s explode",
      type: ApplicationCommandOptionType.Boolean
    }
  ]
} satisfies RESTPutAPIApplicationCommandsJSONBody[number];
