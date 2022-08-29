import Eris from "eris";
import config from "../config/config";
import {stripIndents} from "common-tags";

export default async (client: Eris.GMDIExtension, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  if (guild.id !== config.guildID || member.bot) return;
  
  try {
    if (oldMember?.pending && !member?.pending && !config.botOwner.includes(member.id)) {
      let returnMember: FarewellMemberConclusion = await client.database.get(`replaceWelcomeMessageUser.${member.user.id}`);
  
      let returnMemberMessage = returnMember ? 
      `Selamat datang kembali di Discord server, **${guild.name}**.` :
      stripIndents`
      Selamat datang di Discord server, **${guild.name}**!
      Semoga betah, dan jangan lupa baca ${client.getChannel("274351350656139265").mention || "<#274351350656139265>"} sebelum ngobrol.`
  
      // Embed
      let embeds = new Eris.RichEmbed().setColor(0x24C86E).setTimestamp()
      .setTitle(`Halo, ${member.user.username}#${member.user.discriminator} 👋`)
      .setDescription(returnMemberMessage);
  
      await client.addGuildMemberRole(guild.id, member.id, "312868594549653514");
      
      return client.createMessage(config.channel.general, {content: member.mention, embeds: [embeds]});
    };
  } catch (error) {
    return console.error(error);
  };
};