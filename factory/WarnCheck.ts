import { scheduleJob } from "node-schedule";
import Eris from "eris";
import db from "quick.db";

export default async function (client: Eris.Client) {
  scheduleJob('* 1 * * *', function() {
    let data: WarningLastedOptions[] = Object.values(db.get("warningLasted"));
    for (let val of data) {
      // soon
    };
  });
};