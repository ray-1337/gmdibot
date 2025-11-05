import { Member, Client, JSONMember } from "oceanic.js";
import { channel, roles } from "../handler/Config";
import { usernameHandle } from "../handler/Util";

export default async (client: Client, member: Member, oldMember: JSONMember | null) => {
  if (member.bot || !oldMember) return;

  if (!oldMember?.premiumSince && member?.premiumSince && !oldMember.roles.includes(roles.booster)) {
    return client.rest.channels.createMessage(channel.general, {embeds: [{
      color: 0xf47fff,
      timestamp: new Date().toISOString(),
      author: {
        name: `${usernameHandle(member)} barusan ngeboost server GMDI`,
        iconURL: member.avatarURL("png", 32)
      }
    }]});
  };
};