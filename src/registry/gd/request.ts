import { request, ProxyAgent } from "undici";

const [proxyAddress, proxyPort, proxyUsername, proxyPassword] = (process.env.PROXY_CONTENT_KEY as string).split(" | ");
const dispatcher = new ProxyAgent(`http://${proxyUsername}:${proxyPassword}@${proxyAddress}:${proxyPort}`);

import { defaultData, defaultHeaders, defaultEndpoint } from "./constants";
import { wrapPropertiesToSearchParams, parseRobTopData, isError, decodeMessage, parseResponse } from "./util";

// get official account messages
export async function getMessagesList() {
  const req = await request(defaultEndpoint + "/getGJMessages20.php", {
    dispatcher,
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
    .split("#")?.shift()?.split("|")
    .map(preParsedData => parseRobTopData(preParsedData))
    .map(parsedData => ({
      author: parsedData[6],
      subject: Buffer.from(parsedData[4], "base64").toString("utf-8"),
      date: parsedData[7],
      id: parsedData[1]
    }));
  
  if (!data) return null;

  return data;
};

// get specific message
export async function getIndividualMessage(messageID: string | number) {
  const req = await request(defaultEndpoint + "/downloadGJMessage20.php", {
    dispatcher,
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
    dispatcher,
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
  const searchReq = await request(defaultEndpoint + "/getGJUsers20.php", {
    dispatcher,
    method: "POST",
    body: wrapPropertiesToSearchParams({...defaultData, str: username}).toString(),
    headers: defaultHeaders
  });

  if (searchReq.statusCode !== 200) {
    console.error("Unable to perform users search.");
    return null;
  };

  const rawSearchResponse = await searchReq.body.text();
  if (rawSearchResponse == "-1") {
    console.error(`[${username}] not found [01].`);
    return null;
  };

  const rawSearchUser = parseResponse(rawSearchResponse);
  if (!rawSearchUser) {
    console.error(`Unable to parse "${username}" information.`);
    return null;
  };

  const userInfoReq = await request(defaultEndpoint + "/getGJUserInfo20.php", {
    dispatcher,
    method: "POST",
    body: wrapPropertiesToSearchParams({...defaultData, targetAccountID: rawSearchUser[16] as number}).toString(),
    headers: defaultHeaders
  });

  if (userInfoReq.statusCode !== 200) {
    console.error(`Unable to perform specific user information search. [${username}]`);
    return null;
  };

  /**
   * 3 - stars
   * 4 - demons
   * 13 - official coins
   * 17 - usercoins
   * 46 - diamonds
   */
  const rawUserResponse = await userInfoReq.body.text();
  if (rawUserResponse == "-1") {
    console.error(`[${username}] not found. [02]`);
    return null;
  };

  const user = parseResponse(rawUserResponse);
  if (!user) {
    console.error(`Unable to extract user data. [${username}]`);
    return null;
  };

  return {
    accountID: rawSearchUser[16] as number,
    stars: user[3] as number,
    demons: user[4] as number,
    coins: user[13] as number,
    userCoins: user[17] as number,
    diamonds: user[46] as number
  };
};