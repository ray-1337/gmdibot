import { Client, Member } from "oceanic.js";
import { gmdiGuildID } from "../handler/Config";
import altPrevention from "../registry/altPrevention";

export default async (client: Client, member: Member) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;

  return await altPrevention(client, member.guild, member);
};