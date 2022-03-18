import Eris from "eris";
import config from "../config/config";
import ms from "ms";
import GMDIBot from "../handler/Client";

export default async (client: Eris.Client & GMDIBot, guild: Eris.Guild, member: Eris.Member) => {
  if (guild.id !== config.guildID || member.bot) return;

  client.database.set(`replaceWelcomeMessageUser.${member.user.id}`, {
    activateWhenComingBack: true,
    leavingSince: Date.now(),
    memberID: member.id || member.user.id
  });

  // Embed
  let embeds = new Eris.RichEmbed().setColor(0xC82427).setTimestamp();

  if (Math.floor(Date.now() - member.joinedAt!) < ms("5m")) {
    embeds.setTitle(`Dadah...`).setDescription(`**${member.user.username}#${member.user.discriminator}** langsung keluar dari server.`);
  }

  else {
    embeds.setTitle(`Farewell.`).setDescription(`**${member.user.username}#${member.user.discriminator}** keluar dari server.`);
  };
  
  return client.createMessage(config.channel.general, {embeds: [embeds]});
};