import { Member, GMDIExtension, JSONMember, EmbedOptions } from "oceanic.js";
import config from "../config/config";
import {stripIndents} from "common-tags";

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  if (member.guild.id !== config.guildID || member.bot) return;
  
  try {
    if (oldMember?.pending && !member?.pending) {
      let returnMember: FarewellMemberConclusion = await client.database.get(`replaceWelcomeMessageUser.${member.user.id}`);
  
      let returnMemberMessage = returnMember ? 
      `Selamat datang kembali di Discord server, **${member.guild.name}**.` :
      stripIndents`
      Selamat datang di Discord server, **${member.guild.name}**!
      Semoga betah, dan jangan lupa baca ${client.getChannel("274351350656139265")?.mention || "<#274351350656139265>"} sebelum ngobrol.`
  
      // Embed
      let embed: EmbedOptions = {
        title: `Halo, ${member.user.username}#${member.user.discriminator} 👋`,
        description: returnMemberMessage,
        color: 0x24C86E,
        timestamp: new Date().toISOString()
      };
  
      await client.rest.guilds.addMemberRole(member.guild.id, member.id, "312868594549653514");
      
      return client.rest.channels.createMessage(config.channel.general, {content: member.mention, embeds: [embed]});
    };
  } catch (error) {
    return console.error(error);
  };
};