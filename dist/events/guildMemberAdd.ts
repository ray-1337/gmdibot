import Eris from "eris";
import config from "../config/config";
import db from "quick.db";

export default async (client: Eris.Client, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  // still 
  let userDataWarn = await db.get(`warningLasted.${member.id}`) as WarningLastedOptions;
  if (userDataWarn && userDataWarn.level) {
    return client.editGuildMember(config.guildID, member.id, {roles: [config.warning.role[userDataWarn.level]]});
  };
};