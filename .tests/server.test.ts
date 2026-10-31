import { InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import { beforeAll, describe, expect, it } from 'vitest';
import server from '../src/server.ts';
import { memoryStore } from './test-helpers.ts';

function hex(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString('hex');
}

let keys: { publicKey: CryptoKey; privateKey: CryptoKey };
let env: { DISCORD_PUBLIC_KEY: string; SETTINGS: ReturnType<typeof memoryStore> };

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as typeof keys;
  env = {
    DISCORD_PUBLIC_KEY: hex(await crypto.subtle.exportKey('raw', keys.publicKey)),
    SETTINGS: memoryStore(),
  };
});

async function signedRequest(body: string): Promise<Request> {
  const timestamp = '1700000000';
  const signature = await crypto.subtle.sign(
    'Ed25519',
    keys.privateKey,
    new TextEncoder().encode(timestamp + body),
  );
  return new Request('https://bot.test/', {
    method: 'POST',
    headers: { 'x-signature-ed25519': hex(signature), 'x-signature-timestamp': timestamp },
    body,
  });
}

describe('server', () => {
  it('answers a signed PING', async () => {
    const request = await signedRequest(JSON.stringify({ type: InteractionType.Ping }));
    const response = await server.fetch(request, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: InteractionResponseType.Pong });
  });

  it('rejects a tampered body', async () => {
    const signed = await signedRequest(JSON.stringify({ type: InteractionType.Ping }));
    const request = new Request(signed.url, {
      method: 'POST',
      headers: signed.headers,
      body: '{"type":2}',
    });
    expect((await server.fetch(request, env)).status).toBe(401);
  });

  it('rejects a request with no signature', async () => {
    const request = new Request('https://bot.test/', { method: 'POST', body: '{}' });
    expect((await server.fetch(request, env)).status).toBe(401);
  });

  it('routes /roll to a result', async () => {
    const request = await signedRequest(
      JSON.stringify({
        type: InteractionType.ApplicationCommand,
        member: { user: { id: '111' } },
        data: {
          type: 1,
          name: 'roll',
          options: [{ name: 'dice', type: 4, value: 3 }],
        },
      }),
    );
    const body = (await (await server.fetch(request, env)).json()) as {
      type: number;
      data: { content: string };
    };
    expect(body.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(body.data.content).toContain('3D Black');
  });

  it('routes /roll-dof to one die', async () => {
    const request = await signedRequest(
      JSON.stringify({
        type: InteractionType.ApplicationCommand,
        member: { user: { id: '111' } },
        data: { type: 1, name: 'roll-dof' },
      }),
    );
    const body = (await (await server.fetch(request, env)).json()) as {
      data: { content: string };
    };
    expect(body.data.content).toMatch(/^Die of Fate → \[[1-6]\]$/);
  });

  it('routes /roll-settings and uses the saved emojis on the next /roll', async () => {
    const emojis = '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣';
    const settings = await signedRequest(
      JSON.stringify({
        type: InteractionType.ApplicationCommand,
        guild_id: '999',
        member: { user: { id: '111' } },
        data: {
          type: 1,
          name: 'roll-settings',
          options: [
            { name: 'dice-emojis', type: 1, options: [{ name: 'emojis', type: 3, value: emojis }] },
          ],
        },
      }),
    );
    expect((await server.fetch(settings, env)).status).toBe(200);

    const roll = await signedRequest(
      JSON.stringify({
        type: InteractionType.ApplicationCommand,
        guild_id: '999',
        member: { user: { id: '111' } },
        data: { type: 1, name: 'roll', options: [{ name: 'dice', type: 4, value: 3 }] },
      }),
    );
    const body = (await (await server.fetch(roll, env)).json()) as { data: { content: string } };
    expect(body.data.content).toMatch(/[1-6]️⃣/);
  });

  it('answers GET / and 404s elsewhere', async () => {
    expect((await server.fetch(new Request('https://bot.test/'), env)).status).toBe(200);
    expect((await server.fetch(new Request('https://bot.test/nope'), env)).status).toBe(404);
  });
});
