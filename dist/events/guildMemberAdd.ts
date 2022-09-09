import { GMDIExtension, Guild, Member } from "oceanic.js";
import config from "../config/config";
import newMemberValidation from "../registry/newMemberValidation";

export default async (client: GMDIExtension, guild: Guild, member: Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  newMemberValidation(client, guild, member);
  return;
};