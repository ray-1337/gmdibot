import { GMDIExtension, Guild, Member, User } from "oceanic.js";
import { gmdiGuildID, firstGeneralTextChannelID } from "../handler/Config";
import ms from "ms";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";

export default async (client: GMDIExtension, member: User | Member, guild: Guild) => {
  if (guild.id !== gmdiGuildID || member.bot) return;

  // skip if member still on verification pending
  if (member instanceof Member && member.pending) return;

  // Embed
  let embed = new RichEmbed().setColor(0xC82427).setTimestamp(new Date());

  if (member instanceof Member && Math.floor(Date.now() - new Date(member.joinedAt!).getTime()) < ms("5m")) {
    embed.setTitle("Dadah...").setDescription(`**${client.utility.usernameHandle(member)}** langsung keluar dari server.`);
  }

  else {
    embed.setTitle("Farewell...").setDescription(`**${client.utility.usernameHandle(member)}** keluar dari server.`);
  };
  
  return client.rest.channels.createMessage(firstGeneralTextChannelID, {embeds: embed.toJSON(true)});
};