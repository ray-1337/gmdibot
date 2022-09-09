import { Guild, Member, GMDIExtension, JSONMember } from "oceanic.js";

import membershipScreenings from "../registry/membershipScreenings";
import usernameModeration from "../registry/usernameModeration";
import boostNotification from "../registry/boostNotification"

export default async (client: GMDIExtension, guild: Guild, member: Member, oldMember: JSONMember | null) => {
  // passed Membership Screenings
  membershipScreenings(client, guild, member, oldMember);

  // username moderation
  usernameModeration(client, member);

  // boost notification
  boostNotification(client, member, oldMember);
};