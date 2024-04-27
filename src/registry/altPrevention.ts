import {Client, Guild, Member} from "oceanic.js";
import ms from "ms";

export default async (client: Client, guild: Guild, member: Member) => {
  try {
    const day = ms("1d");
    const age = Date.now() - new Date(member.createdAt).getTime();
    const dayLimit = 30; // 30 days
  
    if (Math.round(age / day) < dayLimit) {
      await client.rest.guilds.removeMember(guild.id, member.id);
      return true;
    } else {
      return false;
    };
  } catch (error) {
    console.error(error);
    return false;
  };
};