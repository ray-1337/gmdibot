import { Member, GMDIExtension, JSONMember } from "oceanic.js";
import Config from "../config/config";

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  if (member.bot || !oldMember) return;

  const boostRole = "589643758564540417";
  if (!oldMember?.premiumSince && member?.premiumSince && !oldMember.roles.includes(boostRole)) {
    const userTag = `${member.username}#${member.discriminator}`;

    return client.rest.channels.createMessage(Config.channel.general, {embeds: [{
      color: 0xf47fff,
      timestamp: new Date().toString(),
      author: {
        name: `${userTag} barusan ngeboost server GMDI`,
        iconURL: member.avatarURL("png", 32)
      }
    }]});
  };
};