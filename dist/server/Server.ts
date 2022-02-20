import nanoexpress from 'nanoexpress';
import fs from "fs";

import dotenv from "dotenv";
dotenv.config({path: process.cwd() + "/.env"});

const app = nanoexpress();

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

export default app.listen(process.env.SERVER_PORT as unknown as number).catch(console.error);