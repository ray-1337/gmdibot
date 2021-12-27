import dotenv from "dotenv";
import GMDIBot from "./handler/Client";
import GMDIEvent from "./handler/Event";
dotenv.config();

const client = new GMDIBot(`Bot ${process.env.DISCORD_BOT_TOKEN}`, {
  intents: ["guilds", "guildMembers", "guildMessages"],
  getAllUsers: true,
  guildCreateTimeout: 30000,
  messageLimit: 3
});

GMDIEvent(client);
client.connect();