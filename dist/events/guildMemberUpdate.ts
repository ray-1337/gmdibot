import Eris from "eris";
import config from "../config/config";
import GMDIBot from "../handler/Client";

import membershipScreenings from "../registry/membershipScreenings";

export default async (client: Eris.Client & GMDIBot, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  if (guild.id !== config.guildID || member.bot) return;

  // passed Membership Screenings
  if (oldMember?.pending && !member?.pending) {
    membershipScreenings(client, guild, member);
  };
};