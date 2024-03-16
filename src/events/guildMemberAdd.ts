import { GMDIExtension, Member } from "oceanic.js";
import { gmdiGuildID } from "../handler/Config";
import altPrevention from "../registry/altPrevention";
import FreeRolesAnomalyDetector from "../handler/FreeRolesAnomalyDetector";

export default async (client: GMDIExtension, member: Member) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;

  FreeRolesAnomalyDetector.startDetect(member);
  return await altPrevention(client, member.guild, member);
};