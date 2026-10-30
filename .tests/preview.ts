import process from "node:process";

import { RollPool, SecureRng, type Shade } from "../src/dice.ts";
import { Buttons, ResultLine } from "../src/format.ts";


// Usage: npm run preview -- <dice> <ob> <B|G|W> <open>
const [dice = "5", ob = "3", shade = "G", open = "false"] = process.argv.slice(2);

const state = {
  userId: "1",
  shade: shade as Shade,
  ob: Number(ob),
  pool: Number(dice),
  open: open === "true",
  fate: false,
  deeds: false,
  callon: false,
  dice: RollPool(Number(dice), open === "true", SecureRng)
};

console.log(ResultLine(state));
console.log(Buttons(state).flatMap(row => row.components).map(button => `[${button.label}${button.disabled ? " (disabled)" : ""}]`).join(" "));
