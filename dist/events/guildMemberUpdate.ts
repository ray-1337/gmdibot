import Eris from "eris";

import membershipScreenings from "../registry/membershipScreenings";
import usernameModeration from "../registry/usernameModeration";
import boostNotification from "../registry/boostNotification"

export default async (client: Eris.GMDIExtension, guild: Eris.Guild, member: Eris.Member, oldMember: Eris.OldMember) => {
  // passed Membership Screenings
  membershipScreenings(client, guild, member, oldMember);

  // username moderation
  usernameModeration(client, member);

  // boost notification
  boostNotification(client, member, oldMember);
};