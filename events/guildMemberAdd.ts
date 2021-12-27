import Eris from "eris";
import config from "../config";
import {stripIndents} from "common-tags";

export = async (client: Eris.Client, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  // Embed
  let embeds = new Eris.RichEmbed().setColor(0x24C86E).setTimestamp()
  .setTitle(`Halo, ${member.user.username}#${member.user.discriminator} 👋`)
  .setDescription(stripIndents`
  Selamat datang di Discord server, **${member.guild.name}**!
  Semoga betah, dan jangan lupa baca ${client.getChannel("274351350656139265").mention || "<#274351350656139265>"} sebelum ngobrol!`);
  return client.createMessage(config.channel.general, {content: member.mention, embeds: [embeds]});
};