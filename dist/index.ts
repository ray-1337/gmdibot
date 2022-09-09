import GMDIBot from "./handler/Client";
import GMDIEvent from "./handler/Event";
import GMDIServer from "./server/Server";
import dotenv from "dotenv";
dotenv.config({path: process.cwd() + "/.env"});

const client = new GMDIBot({
  auth: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  gateway: {
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "MESSAGE_CONTENT"],
    guildCreateTimeout: 30000
  },
});

Promise.all([
  GMDIEvent(client),
  client.connect(),
  GMDIServer
]);