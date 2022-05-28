import Eris from "eris";

import usernameModeration from "../registry/usernameModeration";

export default async (client: Eris.GMDIExtension, user: Eris.User, /*oldUser: Eris.PartialUser*/) => {
  // username moderation
  usernameModeration(client, user);
};