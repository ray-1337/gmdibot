import {GMDIExtension, Guild, Member} from "eris";
import ms from "ms";

export default async (client: GMDIExtension, guild: Guild, member: Member) => {
  const day = ms("1d");
  const age = Date.now() - member.createdAt;
  const dayLimit = 30; // 30 days

  if (Math.round(age / day) < dayLimit) {
    await client.kickGuildMember(guild.id, member.id);
    return true;
  } else {
    return false;
  };
};