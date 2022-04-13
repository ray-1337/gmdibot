import Eris from "eris";
import Config from "../config/config";
import GMDIBot from "../handler/Client";

import contentLogging from "../moderationRegistry/contentLogging";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message) => {
  // console.log(message);
  contentLogging(client, message);
};