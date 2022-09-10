import { GMDIExtension, Guild, Member } from "oceanic.js";
import ms from "ms";
import config from "../config/config";
import usernameModeration from "./usernameModeration";

export default async (client: GMDIExtension, member: Member) => {
  try {
    if (member.guild.id !== config.guildID || member.bot) return;
    
    // user alt checking
    const day = ms("1d");
    const age = Date.now() - new Date(member.createdAt).getTime();
    const dayLimit = 30; // 30 days
    if (Math.round(age / day) < dayLimit) {
      await client.rest.guilds.removeMember(member.guild.id, member.id);
    };

    // nickname validation
    usernameModeration(client, member);

    return;
  } catch (error) {
    console.error(error);
    return false;
  };
};