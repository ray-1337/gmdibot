import { Client, Member } from "oceanic.js";

import { gmdiGuildID, roles } from "../handler/Config";

export default async (_: Client, member: Member) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;

  member.addRole(roles.unverified, "[GMDIBot] New member given unverified role");

  return;
};