import { scheduleJob } from "node-schedule";
import GMDIBot from "../handler/Client";

import UserChat from "./silk/UserChat.FIJI";
import EntranceProposal from "./silk/EntranceProposal.FIJI";
import CountingErrorReset from "./silk/CountingErrorReset.FIJI";
import WarningTimeout from "./silk/WarningTimeout.FIJI";

export default async function (client: GMDIBot) {
  // user chat
  // scheduleJob({hour: 0, minute: 0, tz: "Asia/Jakarta"}, () => UserChat(client));

  // warning timeout
  // scheduleJob('* */1 * * *', () => WarningTimeout(client));

  // member welcome message replacement
  // scheduleJob('* */12 * * *', () => EntranceProposal());

  // counting error reset
  // scheduleJob('*/30 * * * *', () => CountingErrorReset(client));
};