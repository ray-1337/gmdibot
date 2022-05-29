import Eris from "eris";
import Config from "../config/config";

export default async (client: Eris.GMDIExtension, member: Eris.Member, oldMember: Eris.OldMember) => {
  if (member.bot) return;

  if (!oldMember?.premiumSince && member.premiumSince) {
    const userTag = `${member.username}#${member.discriminator}`;
    const embed = new Eris.RichEmbed().setColor(0xf47fff).setTimestamp()
    .setAuthor(`${userTag} barusan ngeboost server GMDI`, undefined, member.user.dynamicAvatarURL("png", 32))

    return client.createMessage(Config.channel.general, {embeds: [embed]});
  };
};