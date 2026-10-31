export interface GuildSettings {
  diceEmojis?: string[];
}

export interface SettingsStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const DiceEmojiCount = 6;
const Emoji = new RegExp("<a?:\\w{2,32}:\\d{17,20}>|\\p{RGI_Emoji}", "gv");

function Key(guildId: string): string {
  return `guild:${guildId}`;
}

export async function LoadSettings(store: SettingsStore, guildId?: string): Promise<GuildSettings> {
  if (!guildId) return {};

  try {
    const stored = await store.get(Key(guildId));
    return stored ? (JSON.parse(stored) as GuildSettings) : {};
  }
  catch (error) {
    console.error("Could not load settings", error);
    return {};
  }
}

export async function SaveSettings(store: SettingsStore, guildId: string, settings: GuildSettings): Promise<void> {
  await store.put(Key(guildId), JSON.stringify(settings));
}

export async function DeleteSettings(store: SettingsStore, guildId: string): Promise<void> {
  await store.delete(Key(guildId));
}

export function ParseDiceEmojis(text: string): string[] | null {
  const emojis = text.match(Emoji) ?? [];
  const leftover = text.replace(Emoji, "").replace(/[\s,]/g, "");
  return emojis.length === DiceEmojiCount && leftover === "" ? emojis : null;
}
