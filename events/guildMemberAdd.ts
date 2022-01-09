import Eris from "eris";
import config from "../config";

export = async (client: Eris.Client, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  // ???
};