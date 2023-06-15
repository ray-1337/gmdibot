import { GMDIExtension, Member } from "oceanic.js";
import { gmdiGuildID } from "../handler/Config";

export default async (client: GMDIExtension, member: Member) => {
  try {
    if (member.guild.id !== gmdiGuildID || member.bot) return;

    return;
  } catch (error) {
    console.error(error);
    return false;
  };
};