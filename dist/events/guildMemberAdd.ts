import { GMDIExtension, Member } from "oceanic.js";
import config from "../config/config";
import newMemberValidation from "../registry/newMemberValidation";

export default async (client: GMDIExtension, member: Member) => {
  if (member.guild.id !== config.guildID || member.bot) return;

  newMemberValidation(client, member);
  return;
};