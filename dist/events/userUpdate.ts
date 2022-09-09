import {GMDIExtension, User} from "oceanic.js";

import usernameModeration from "../registry/usernameModeration";

export default async (client: GMDIExtension, user: User, /*oldUser: PartialUser*/) => {
  // username moderation
  usernameModeration(client, user);
};