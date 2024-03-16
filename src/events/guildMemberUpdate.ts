import { Member, GMDIExtension, JSONMember } from "oceanic.js";

import membershipScreenings from "../registry/membershipScreenings";
import boostNotification from "../registry/boostNotification";
import usernameModeration from "../registry/usernameModeration";
import FreeRolesAnomalyDetector from "../handler/FreeRolesAnomalyDetector";

export default async (client: GMDIExtension, member: Member, oldMember: JSONMember | null) => {
  // passed Membership Screenings
  membershipScreenings(client, member, oldMember);

  // boost notification
  boostNotification(client, member, oldMember);

  // guild nickname moderation
  usernameModeration(client, member, oldMember);

  // anomaly detector
  FreeRolesAnomalyDetector.memberUpdated(member);
};
