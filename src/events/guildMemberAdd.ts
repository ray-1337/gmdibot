import { Client, Member } from "oceanic.js";

import { gmdiGuildID, unverifiedRoleID } from "../handler/Config";

export default async (_: Client, member: Member) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;

  member.addRole(unverifiedRoleID, "[GMDIBot] New member given unverified role");

  return;
};