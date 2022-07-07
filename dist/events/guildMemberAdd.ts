import Eris from "eris";
import config from "../config/config";

import usernameModeration from "../registry/usernameModeration";

export default async (client: Eris.GMDIExtension, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  usernameModeration(client, member);

  // client.addGuildMemberRole(guild.id, member.id, "312868594549653514").catch(() => {});

  // still 
  // let userDataWarn = await client.database.get(`warningLasted.${member.id}`) as WarningLastedOptions;
  // if (userDataWarn && userDataWarn.level) {
  //   return client.editGuildMember(config.guildID, member.id, {roles: [config.warning.role[userDataWarn.level]]});
  // };
};