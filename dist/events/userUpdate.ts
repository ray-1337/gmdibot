import Eris from "eris";
import GMDIBot from "../handler/Client";

import usernameModeration from "../registry/usernameModeration";

export default async (client: Eris.Client & GMDIBot, user: Eris.User, /*oldUser: Eris.PartialUser*/) => {
  // username moderation
  usernameModeration(client, user);
};