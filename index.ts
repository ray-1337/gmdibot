import GMDIBot from "./handler/Client";
import GMDIEvent from "./handler/Event";
import GMDIServer from "./server/Server";
import dotenv from "dotenv";
dotenv.config();

const client = new GMDIBot(`Bot ${process.env.DISCORD_BOT_TOKEN}`, {
  intents: ["guilds", "guildMembers", "guildMessages"],
  getAllUsers: true,
  guildCreateTimeout: 30000,
  messageLimit: 3
});

Promise.all([
  GMDIEvent(client),
  client.connect(),
  GMDIServer
])