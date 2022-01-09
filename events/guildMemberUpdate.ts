import Eris from "eris";
import config from "../config";
import {stripIndents} from "common-tags";
import db from "quick.db";

export = async (client: Eris.Client, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  if (guild.id !== config.guildID || member.bot) return;

  // passed Membership Screenings
  if (oldMember.pending && !member.pending) {
    let returnMember: FarewellMemberConclusion = await db.get(`replaceWelcomeMessageUser.${member.user.id}`);

    let returnMemberMessage = returnMember ? 
    `Selamat datang kembali di Discord server, **${member.guild.name}**.` :
    stripIndents`
    Selamat datang di Discord server, **${member.guild.name}**!
    Semoga betah, dan jangan lupa baca ${client.getChannel("274351350656139265").mention || "<#274351350656139265>"} sebelum ngobrol.`
  
    // Embed
    let embeds = new Eris.RichEmbed().setColor(0x24C86E).setTimestamp()
    .setTitle(`Halo, ${member.user.username}#${member.user.discriminator} 👋`)
    .setDescription(returnMemberMessage);
    return client.createMessage(config.channel.general, {content: member.mention, embeds: [embeds]});
  };
};