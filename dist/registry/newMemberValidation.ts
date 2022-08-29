import { GMDIExtension, Guild, Member } from "eris";
import ms from "ms";
import config from "../config/config";
import usernameModeration from "./usernameModeration";

export default async (client: GMDIExtension, guild: Guild, member: Member) => {
  try {
    if (guild.id !== config.guildID || member.bot) return;
    
    // user alt checking
    const day = ms("1d");
    const age = Date.now() - member.createdAt;
    const dayLimit = 30; // 30 days
    if (Math.round(age / day) > dayLimit) {
      await client.kickGuildMember(guild.id, member.id);
    };

    // nickname validation
    usernameModeration(client, member);

    // giving role (last)
    await client.addGuildMemberRole(guild.id, member.id, "312868594549653514");

    return;
  } catch (error) {
    console.error(error);
    return false;
  };
};