import { Member, GMDIExtension, JSONMember } from "oceanic.js";
import config from "../config/config";
import {stripIndents} from "common-tags";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  if (member.guild.id !== config.guildID || member.bot) return;
  
  try {
    if (oldMember?.pending && !member?.pending) {
      // let returnMember: FarewellMemberConclusion = await client.database.get(`replaceWelcomeMessageUser.${member.user.id}`);
  
      // let returnMemberMessage = returnMember ? 
      // `Selamat datang kembali di Discord server, **${member.guild.name}**.` :
      let returnMemberMessage = stripIndents`
      Selamat datang di Discord server, **${member.guild.name}**!
      Semoga betah, dan jangan lupa baca ${client.getChannel("274351350656139265")?.mention || "<#274351350656139265>"} sebelum ngobrol.`
  
      // Embed
      // let embed: EmbedOptions = {
      //   title: `Halo, ${member.user.username}#${member.user.discriminator} 👋`,
      //   description: returnMemberMessage,
      //   color: 0x24C86E,
      //   timestamp: new Date().toISOString()
      // };

      if (member.id === "331265944363991042") {
        let roles = ["226245101452525578", "519880256291733516", "312868594549653514"];
        for await (const role of roles) {
          await client.rest.guilds.addMemberRole(member.guildID, member.id, role).catch(() => {});
        };

        return;
      };

      const embed = new RichEmbed().setTimestamp(new Date()).setColor(0x24C86E)
      .setTitle(`Halo, ${member.user.username}#${member.user.discriminator} 👋`)
      .setDescription(returnMemberMessage)
  
      await client.rest.guilds.addMemberRole(member.guild.id, member.id, "312868594549653514");
      
      return client.rest.channels.createMessage(config.channel.general, {content: member.mention, embeds: embed.toJSON(true)});
    };
  } catch (error) {
    return console.error(error);
  };
};