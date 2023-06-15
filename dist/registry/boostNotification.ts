import { Member, GMDIExtension, JSONMember } from "oceanic.js";
import { firstGeneralTextChannelID } from "../handler/Config";

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  if (member.bot || !oldMember) return;

  const boostRole = "589643758564540417";
  if (!oldMember?.premiumSince && member?.premiumSince && !oldMember.roles.includes(boostRole)) {
    return client.rest.channels.createMessage(firstGeneralTextChannelID, {embeds: [{
      color: 0xf47fff,
      timestamp: new Date().toISOString(),
      author: {
        name: `${client.utility.usernameHandle(member)} barusan ngeboost server GMDI`,
        iconURL: member.avatarURL("png", 32)
      }
    }]});
  };
};