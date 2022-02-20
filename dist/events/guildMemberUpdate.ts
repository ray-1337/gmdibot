import Eris from "eris";
import config from "../config/config";

import membershipScreenings from "../moderationRegistry/membershipScreenings";

export default async (client: Eris.Client, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  if (guild.id !== config.guildID || member.bot) return;

  // passed Membership Screenings
  if (oldMember?.pending && !member?.pending) {
    membershipScreenings(client, guild, member);
  };
};