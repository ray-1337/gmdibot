import { GMDIExtension, Guild, Member, User } from "oceanic.js";
import { gmdiGuildID, firstGeneralTextChannelID } from "../handler/Config";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import FreeRolesAnomalyDetector from "../handler/FreeRolesAnomalyDetector";

export default async (client: GMDIExtension, member: User | Member, guild: Guild) => {
  if (guild.id !== gmdiGuildID || member.bot) return;

  // skip if member still on verification pending
  if (member instanceof Member && member.pending) return;

  // Anomaly detector
  if (member instanceof Member) {
    FreeRolesAnomalyDetector.stopDetect(member);
  }

  // Embed
  const embed = new RichEmbed()
  .setColor(0xC82427)
  .setTimestamp(new Date())
  .setTitle("Farewell...")
  .setDescription(`**${client.utility.usernameHandle(member)}** keluar dari server.`);
  
  return client.rest.channels.createMessage(firstGeneralTextChannelID, {
    embeds: embed.toJSON(true)
  });
};