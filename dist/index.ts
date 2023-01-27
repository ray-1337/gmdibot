import "dotenv/config";
import vault from "dotenv-vault-core";
vault.config();

import GMDIBot from "./handler/Client";
import GMDIEvent from "./handler/Event";

let auth = "";

if (process.env.npm_lifecycle_event === "start") {
  auth = process.env.DISCORD_BOT_TOKEN!
} else if (!process.env.npm_lifecycle_event || process.env.npm_lifecycle_event === "dev") {
  auth = process.env.DEV_DISCORD_TOKEN!
};

const client = new GMDIBot({
  auth: `Bot ${auth}`,
  gateway: {
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "MESSAGE_CONTENT"],
    guildCreateTimeout: 30000
  },
});

GMDIEvent(client);

client.connect();