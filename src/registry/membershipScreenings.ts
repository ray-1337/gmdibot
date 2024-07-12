import { Member, Client, JSONMember } from "oceanic.js";
import { gmdiGuildID, firstGeneralTextChannelID } from "../handler/Config";
import { usernameHandle } from "../handler/Util";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";

export default async (client: Client, member: Member, oldMember: JSONMember | null) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;
  
  try {
    if (oldMember?.pending && !member?.pending) {
      const embed = new RichEmbed().setTimestamp(new Date()).setColor(0x24C86E)
      .setTitle(`Halo, ${usernameHandle(member)} 👋`);
  
      await client.rest.guilds.addMemberRole(member.guild.id, member.id, "312868594549653514");
      
      return client.rest.channels.createMessage(firstGeneralTextChannelID, {
        content: member.mention,
        embeds: embed.toJSON(true)
      });
    };
  } catch (error) {
    return console.error(error);
  };
};