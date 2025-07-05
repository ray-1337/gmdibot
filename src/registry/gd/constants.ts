import type { UndiciHeaders } from "undici/types/dispatcher";

import { hashRobTopCredential } from "./util";

export const defaultEndpoint = "https://www.boomlings.com/database";

export const [officialAccountId, officialAccountKey, officialUDID, officialUUID] = (process.env.GD_ACCOUNT_KEY as string).split(" | ");

export const defaultHeaders: UndiciHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": ""
};

export const defaultData = {
  accountID: officialAccountId,
  binaryVersion: 45,
  gameVersion: 22,
  gjp2: hashRobTopCredential(officialAccountKey),
  secret: "Wmfd2893gb7",
  udid: officialUDID,
  uuid: officialUUID
};