import Eris from "eris";
import config from "../config/config";
import newMemberValidation from "../registry/newMemberValidation";

export default async (client: Eris.GMDIExtension, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  newMemberValidation(client, guild, member);
  return;
};