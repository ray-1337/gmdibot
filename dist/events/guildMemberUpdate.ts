import { Member, GMDIExtension, JSONMember } from "oceanic.js";

import membershipScreenings from "../registry/membershipScreenings";
import usernameModeration from "../registry/usernameModeration";
import boostNotification from "../registry/boostNotification"

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  // passed Membership Screenings
  membershipScreenings(client, member, oldMember);

  // username moderation
  usernameModeration(client, member);

  // boost notification
  boostNotification(client, member, oldMember);
};