import { GMDIExtension, Guild, Member, EmbedOptions } from "oceanic.js";
import config from "../config/config";
import ms from "ms";

export default async (client: GMDIExtension, guild: Guild, member: Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  // skip if member still on verification pending
  if (member.pending || config.botOwner.includes(member.id)) return;

  client.database.set(`replaceWelcomeMessageUser.${member.user.id}`, {
    activateWhenComingBack: true,
    leavingSince: Date.now(),
    memberID: member.id || member.user.id
  });

  // Embed
  // let embeds = new Eris.RichEmbed().setColor(0xC82427).setTimestamp();
  let embed: EmbedOptions = {
    color: 0xC82427,
    timestamp: Date.now().toString()
  };

  if (Math.floor(Date.now() - new Date(member.joinedAt!).getTime()) < ms("5m")) {
    embed.title = "Dadah...";
    embed.description = `**${member.user.username}#${member.user.discriminator}** langsung keluar dari server.`;
  }

  else {
    embed.title = "Farewell...";
    embed.description = `**${member.user.username}#${member.user.discriminator}** keluar dari server.`;
  };
  
  return client.rest.channels.createMessage(config.channel.general, {embeds: [embed]});
};