import Eris from "eris";
import GMDIBot from "../handler/Client";

import membershipScreenings from "../registry/membershipScreenings";
import usernameModeration from "../registry/usernameModeration";

export default async (client: Eris.Client & GMDIBot, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  // passed Membership Screenings
  membershipScreenings(client, guild, member, oldMember);

  // username moderation
  usernameModeration(client, member);
};