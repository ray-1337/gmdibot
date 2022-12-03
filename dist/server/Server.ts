import Express, {json as parseJSON} from "express";
import fs from "fs";
import redis from "../Cache";
import helmet from "helmet";
import {subKey as gmdiBmkgSubKey} from "../registry/bmkgNotification";

const app = Express();

app
.use(parseJSON({inflate: true, strict: false}))
.use(helmet());

app.get('/', (_, res) => {
  return res.send("ngapain lu liat-liat. kepo ya.");
});

app.get('/:filename', (req, res) => {
  if (!req.params?.filename || !fs.existsSync(`../gmdi-content-logging/${req.params.filename}`)) {
    res.status(404);
    return res.send("unknown content");
  };

  return res.sendFile(`../gmdi-content-logging/${req.params.filename}`);
});

app.get('/favicon.ico', (_, res) => {
  res.status(206);
  return res.end();
});

// bmkg notification features
app
.use("/twitter/bmkg/", (req, res, next) => {
  console.log(new Date().getTime(), req.body);
  
  // only support text/plain, cus its just a link
  if (req.headers["content-type"] !== "application/json") {
    return res.status(415).send("only support application/json");
  };

  // to prevent unauthorized tweets
  if (!req.headers?.authorization || req.headers.authorization !== process.env.TWITTER_WEBHOOK_IFTTT_SAFETY) {
    return res.sendStatus(401);
  };

  next();
})
.post("/twitter/bmkg/prod", async (req, res) => {
  const identifierLengthRegex = /\d{18,20}/gi;

  // no body presented
  if (!req?.body?.url) return res.sendStatus(400);

  // no url twitter id presented
  if (!req.body.url?.match(identifierLengthRegex)?.[0]) return res.sendStatus(400);

  try {
    await redis.publish(gmdiBmkgSubKey, req.body.url.match(identifierLengthRegex)[0]);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  };
});

export default app.listen(Number(process.env?.SERVER_PORT || 3000), () => {
  console.log("Server: Ready.");
});