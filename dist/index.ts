import "dotenv/config";

import GMDIBot from "./handler/Client";
import GMDIEvent from "./handler/Event";
// import "./server/Server";

const client = new GMDIBot({
  auth: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  gateway: {
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "MESSAGE_CONTENT"],
    guildCreateTimeout: 30000
  },
  collectionLimits: {
    messages: 40
  }
});

GMDIEvent(client);

client.connect();