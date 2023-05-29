import { GMDIExtension, Member } from "oceanic.js";
import { gmdiGuildID } from "../handler/Config";
import usernameModeration from "./usernameModeration";

export default async (client: GMDIExtension, member: Member) => {
  try {
    if (member.guild.id !== gmdiGuildID || member.bot) return;

    // nickname validation
    usernameModeration(client, member);

    return;
  } catch (error) {
    console.error(error);
    return false;
  };
};