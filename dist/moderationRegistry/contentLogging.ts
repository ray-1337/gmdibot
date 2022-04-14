import Eris from "eris";
import Util from "../handler/Util";
import undici from "undici";
import { stripIndents } from "common-tags";
import config from "../config/config";
import fs from "fs";

const util = new Util();

export = async (client: Eris.Client, message: Eris.Message) => {
  try {
    if (!message || message.author.bot) return;

    const embed = new Eris.RichEmbed().setColor(0x242424).setTitle("Deleted Content")
      .setAuthor(`${message.author.username}#${message.author.discriminator}`, undefined, message.author.dynamicAvatarURL("png", 128))
      .addField("User Information", stripIndents`
      **Channel:** ${message.channel.mention}
      **User ID:** ${message.author.id}
      ${message.content?.length > 0 ? `**Caption:** ${util.truncate(message.content, 64)}` : ""}`);

    let videoRegexMimeType: RegExp = /^(video)\/.*/gi;
    let listDeletedContent: string[] = [];

    if (message.attachments?.length) {
      if (message.attachments.length === 1) {
        if (!message.attachments[0].content_type) return;

        let promisedStore = await contentStore(message.author.id, message.attachments[0].proxy_url);
        if (promisedStore) listDeletedContent.push(promisedStore);

        if (!videoRegexMimeType.test(message.attachments[0].content_type)) {
          embed.setImage(message.attachments[0].proxy_url);
        };
      }

      else if (message.attachments.length > 1) {
        for await (let content of message.attachments) {
          if (!content.content_type) continue;

          let promisedStore = await contentStore(message.author.id, content.proxy_url);
          if (promisedStore) listDeletedContent.push(promisedStore);
          
          continue;
        };

        embed.addField(`Backup Endpoint (Total: ${listDeletedContent.length})`, listDeletedContent.map(x => `- ${x}`).join("\n"))
      };
    }

    else return;

    // work in progress.
    // if (message.embeds) {
    // };

    return client.createMessage(config.channel.modlog, { embeds: [embed] });
  } catch (error) {
    console.error(error);
  };
};

async function contentStore(identifier: string, url: string) {
  try {
    let UIDLength = 12;
    let endpoint = config.endpoint.contentLogging;
    let storagePath = "/home/ray/gmdi-content-logging/";

    let data = await undici.request(url, { method: "GET" });
    if (!data?.headers["content-type"] || !data?.body) return;

    let extension = util.contentTypeDecide(data.headers["content-type"]);
    if (!extension) return;

    let generatedFileName = `${identifier}.${UIDGenerator(UIDLength)}.${extension}`;
    let stream = fs.createWriteStream(storagePath + generatedFileName);
    
    stream.once('open', async () => {
      stream.write(Buffer.from(await data.body.arrayBuffer()));
      stream.end();
    });

    return endpoint + generatedFileName;
  } catch (error) {
    return console.error(error);
  };
};

function UIDGenerator(length: number) {
  let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let randVal = "";

  for (let i = 0, n = charset.length; i < length; ++i) {
    randVal += charset.charAt(Math.floor(Math.random() * n));
  };

  return randVal;
};