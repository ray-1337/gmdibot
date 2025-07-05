import { request } from "undici";

import { defaultData, defaultHeaders, defaultEndpoint } from "./constants";
import { wrapPropertiesToSearchParams, parseRobTopData, isError, decodeMessage } from "./util";

// get official account messages
export async function getMessagesList() {
  const req = await request(defaultEndpoint + "/getGJMessages20.php", {
    method: "POST",
    body: wrapPropertiesToSearchParams(defaultData).toString(),
    headers: defaultHeaders
  });

  if (req.statusCode !== 200) {
    return null;
  };

  const raw = await req.body.text();
  if (!raw || isError(raw)) return null;

  const data = raw
    .split("|")
    .map(preParsedData => parseRobTopData(preParsedData))
    .map(parsedData => ({
      author: parsedData[6],
      subject: Buffer.from(parsedData[4], "base64").toString("utf-8"),
      date: parsedData[7],
      id: parsedData[1]
    }))

  return data;
};

// get specific message
export async function getIndividualMessage(messageID: string | number) {
  const req = await request(defaultEndpoint + "/getGJMessages20.php", {
    method: "POST",
    body: wrapPropertiesToSearchParams({...defaultData, messageID}).toString(),
    headers: defaultHeaders
  });

  if (req.statusCode !== 200) {
    return null;
  };

  const raw = await req.body.text();
  if (!raw || isError(raw)) return null;

  const parsedData = parseRobTopData(raw);

  return {
    subject: Buffer.from(parsedData[4], "base64").toString("utf-8"),
    content: decodeMessage(parsedData[5]),
    id: +parsedData[1]
  };
};

export async function deleteIndividualMessage(messageID: string | number) {
  const req = await request(defaultEndpoint + "/deleteGJMessages20.php", {
    method: "POST",
    body: wrapPropertiesToSearchParams({...defaultData, messageID}).toString(),
    headers: defaultHeaders
  });

  if (req.statusCode !== 200) {
    return false;
  };

  const res = await req.body.text();
  return res === "1";
};

// get user account data
export async function getGeometryDashUser(username: string) {
  const req = await fetch("https://gdbrowser.com/api/profile/" + username, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  if (!req.ok) {
    return null;
  };

  return await req.json() as Record<`${"star" | "diamond" | "coin" | "userCoin" | "demon"}s`, number> & { accountID: string };
};