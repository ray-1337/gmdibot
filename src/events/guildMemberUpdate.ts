import { Member, Client, JSONMember } from "oceanic.js";

import membershipScreenings from "../registry/membershipScreenings";
import boostNotification from "../registry/boostNotification";
import usernameModeration from "../registry/usernameModeration";
import birthdayRoleControl from "../registry/birthdayRole";

export default async (client: Client, member: Member, oldMember: JSONMember | null) => {
  // passed Membership Screenings
  membershipScreenings(client, member, oldMember);

  // boost notification
  boostNotification(client, member, oldMember);

  // guild nickname moderation
  usernameModeration(client, member, oldMember);

  // birthday role control
  birthdayRoleControl(client, member, oldMember)
};