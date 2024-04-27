import { Member, Client, JSONMember } from "oceanic.js";
import { gmdiGuildID, firstGeneralTextChannelID } from "../handler/Config";
import { shuffle } from "../handler/Util";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";

const rules = "274351350656139265";

const pregeneratedWelcomeText = [
  "Selamat datang di server Discord kami! Silakan perkenalkan diri kamu dan nikmati pengalaman seru di server kami.",
  "Hai! Selamat datang di server Discord kami yang ramah dan menyenangkan. Jangan ragu untuk bergabung dalam diskusi dan kegiatan yang diadakan di server.",
  `Selamat datang di komunitas Discord kami! Kami senang bisa memiliki kamu di sini. Pastikan kamu membaca <#${rules}> sebelum memulai obrolan.`,
  "Hai, selamat datang di server Discord kami. Kami berharap kamu bisa menemukan banyak teman baru dan menikmati waktu yang menyenangkan di sini.",
  "Selamat datang di server Discord kami, di mana kamu bisa bertemu dan berinteraksi dengan orang-orang dari berbagai belahan dunia. Semoga kamu merasa nyaman di sini.",
  "Halo, selamat datang di server Discord kami! Kami senang kamu bergabung dengan kami dan berharap kamu bisa menemukan pengalaman yang menyenangkan dan bermanfaat di sini.",
  "Selamat datang di server Discord kami yang berfokus pada topik tertentu. Nikmati diskusi yang berkualitas dan temukan teman baru yang memiliki minat yang sama.",
  "Hai! Selamat datang di server Discord kami yang hangat dan ramah. Kami berharap kamu bisa merasa seperti di rumah di sini.",
  "Selamat datang di server Discord kami yang bersemangat dan penuh kehidupan. Kami harap kamu bisa merasa termotivasi dan menginspirasi di sini.",
  "Selamat datang di server Discord kami! Kami senang bisa memiliki kamu di sini dan berharap kamu bisa menemukan komunitas yang menyenangkan dan mendukung di sini."
];

export default async (client: Client, member: Member, oldMember: JSONMember | null) => {
  if (member.guild.id !== gmdiGuildID || member.bot) return;
  
  try {
    if (oldMember?.pending && !member?.pending) {
      const embed = new RichEmbed().setTimestamp(new Date()).setColor(0x24C86E)
      .setTitle(`Halo, ${client.utility.usernameHandle(member)} 👋`)
      .setDescription(shuffle(pregeneratedWelcomeText)[0])
  
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