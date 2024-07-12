import "dotenv/config";

import { Client } from "oceanic.js";

import GMDIEvent from "./handler/Event";

import "./registry/dayjs";

const client = new Client({
  auth: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  gateway: {
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "MESSAGE_CONTENT"],
    guildCreateTimeout: 30000
  },
  collectionLimits: {
    messages: 200,
    auditLogEntries: 0,
    autoModerationRules: 0,
    groupChannels: 0,
    guildThreads: 0,
    integrations: 0,
    privateChannels: 0,
    scheduledEvents: 0,
    stageInstances: 0,
    unavailableGuilds: 0,
    voiceStates: 0,
    voiceMembers: 0,
    stickers: 0,
    invites: 0
  }
});

GMDIEvent(client);

client.connect();