import { Client, Guild, Member, User } from "oceanic.js";
import { gmdiGuildID, channel, roles } from "../handler/Config";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { usernameHandle } from "../handler/Util";

export default async (client: Client, member: User | Member, guild: Guild) => {
  if (guild.id !== gmdiGuildID || !(member instanceof Member) || member.bot || member.pending || member.roles.some(roleID => roleID === roles.unverified)) {
    return;
  };

  // Embed
  const embed = new RichEmbed()
    .setColor(0xC82427)
    .setTimestamp(new Date())
    .setTitle("Farewell...")
    .setDescription(`**${usernameHandle(member)}** keluar dari server.`);
  
  return client.rest.channels.createMessage(channel.general, {
    embeds: embed.toJSON(true)
  });
};