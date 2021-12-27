import Eris from "eris";
import config from "../config";
import {stripIndents} from "common-tags";

export = async (client, guild, member) => {
  if (guild.id !== config.guildID || member.bot) return;

  // db.set(`replaceWelcomeMessageUser.${member.user.id}`, true);

  // Embed
  let embeds = new Eris.RichEmbed().setColor(0xC82427).setTimestamp()
  .setTitle(`Farewell.`).setDescription(`**${member.user.username}** telah keluar dari server.`);
  
  return client.createMessage(config.channel.general, {embeds: [embeds]});
};