import { Client, Guild, Member, User } from "oceanic.js";
import { gmdiGuildID, firstGeneralTextChannelID } from "../handler/Config";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { usernameHandle } from "../handler/Util";

export default async (client: Client, member: User | Member, guild: Guild) => {
  if (guild.id !== gmdiGuildID || member.bot) return;

  // skip if member still on verification pending
  if (member instanceof Member && member.pending) return;

  // Embed
  const embed = new RichEmbed()
  .setColor(0xC82427)
  .setTimestamp(new Date())
  .setTitle("Farewell...")
  .setDescription(`**${usernameHandle(member)}** keluar dari server.`);
  
  return client.rest.channels.createMessage(firstGeneralTextChannelID, {
    embeds: embed.toJSON(true)
  });
};