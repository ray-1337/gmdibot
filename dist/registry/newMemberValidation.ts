import { GMDIExtension, Member } from "oceanic.js";
import config from "../config/config";
import usernameModeration from "./usernameModeration";

export default async (client: GMDIExtension, member: Member) => {
  try {
    if (member.guild.id !== config.guildID || member.bot) return;

    // nickname validation
    usernameModeration(client, member);

    return;
  } catch (error) {
    console.error(error);
    return false;
  };
};