import { GMDIExtension, Member } from "oceanic.js";
import config from "../handler/Config";
import newMemberValidation from "../registry/newMemberValidation";
import altPrevention from "../registry/altPrevention";

export default async (client: GMDIExtension, member: Member) => {
  if (member.guild.id !== config.guildID || member.bot) return;

  if (!(await altPrevention(client, member.guild, member))) {
    newMemberValidation(client, member);
  };
};