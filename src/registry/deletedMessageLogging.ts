import { Message, PossiblyUncachedMessage, Client, Embed } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { modlogChannelID } from "../handler/Config";
import { randomNumber, truncate } from "../handler/Util";
import { pseudoRandomBytes } from "crypto";
import { request } from "undici";

export default async function (client: Client, message: PossiblyUncachedMessage) {
  if (!(message instanceof Message) || !message?.author || message?.author?.bot) return;

  try {
    const embed = new EmbedBuilder().setColor(0x7289DA).setTimestamp(new Date());

    if (message?.content.length) {
      embed.addField("Caption", truncate(message.content, 1024))
    };

    let videoRegexMimeType = /^(video)\/.*/gi;
    let acceptableEmbedsRegexType = /^(video|image)$/gi;
    let listDeletedContent: string[] = [];

    // attachments
    if (message.attachments?.size) {
      if (message.attachments.size === 1) {
        const currentContent = message.attachments.toArray()?.[0];
        if (!currentContent.contentType) return;

        let promisedStore = await storeToCDN(message.author.id, currentContent.proxyURL);

        if (!videoRegexMimeType.test(currentContent.contentType)) {
          if (promisedStore) {
            listDeletedContent.push(promisedStore);
            embed.setImage(promisedStore);
          } else {
            embed.setImage(currentContent.proxyURL);
          };
        };
      }

      else if (message.attachments.size > 1) {
        for await (let content of message.attachments.toArray()) {
          if (!content.contentType) continue;

          let promisedStore = await storeToCDN(message.author.id, content.proxyURL);
          if (promisedStore) {
            listDeletedContent.push(promisedStore);
          };

          continue;
        };
      };
    }

    // embeds
    if (message.embeds?.length) {
      if (message.embeds.length === 1) {
        if (message.embeds[0].type?.match(acceptableEmbedsRegexType)) {
          let URLDecision: Embed["video"] | Embed["image"] | null = null;

          if (message.embeds[0].type == "video" && message.embeds[0].video) {
            URLDecision = message.embeds[0].video;
          } else if (message.embeds[0].type == "image" && message.embeds[0].image) {
            URLDecision = message.embeds[0].image;
          };

          if (URLDecision?.proxyURL) {
            let promisedStore = await storeToCDN(message.author.id, URLDecision.proxyURL);
            if (promisedStore) listDeletedContent.push(promisedStore);

            if (message.embeds[0].type !== "video") {
              if (promisedStore) {
                embed.setImage(promisedStore);
              } else {
                embed.setImage(URLDecision.proxyURL);
              };
            };
          };
        };
      }

      else if (message.embeds.length > 1) {
        for await (let embed of message.embeds) {
          if (!embed.type?.match(acceptableEmbedsRegexType)) continue;

          let URLDecision: Embed["video"] | Embed["image"] | null = null;

          if (embed.type == "video" && embed.video) {
            URLDecision = embed.video;
          } else if (embed.type == "image" && embed.image) {
            URLDecision = embed.image;
          };

          if (URLDecision?.proxyURL) {
            let promisedStore = await storeToCDN(message.author.id, URLDecision.proxyURL);
            if (promisedStore) {
              listDeletedContent.push(promisedStore);
            };
          };

          continue;
        };
      };
    };

    if (listDeletedContent?.length) {
      embed.addField(`Backup Endpoint (Total: ${listDeletedContent.length})`, listDeletedContent.map(x => `- ${x}`).join("\n"));

      return client.rest.channels.createMessage(modlogChannelID, {
        embeds: embed.toJSON(true)
      });
    };
  } catch (error) {
    return console.error(error);
  };
};

async function storeToCDN(authorID: string, url: string): Promise<string | null> {
  try {
    if (
      !process.env?.BUNNYCDN_HOSTNAME?.length ||
      !process.env?.BUNNYCDN_USERNAME?.length ||
      !process.env?.BUNNYCDN_PASSWORD?.length ||
      !process.env?.BUNNYCDN_ENDPOINT?.length
    ) return null;

    let data = await request(url, { method: "GET" });
    if (!data?.headers?.["content-type"]?.length || !data?.body) return null;

    const contentType = String(data.headers["content-type"]);

    const extension = {
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/jpg": "jpg",
      "image/webp": "webp",
      "video/webm": "webm",
      "audio/mpeg": "mp3",
      "video/mpeg": "mp4", 
      "video/mp4": "mp4",
      "video/quicktime": "mov"
    };

    const availableExtension = extension?.[contentType];
    if (!availableExtension?.length) return null;

    const randomFileID = pseudoRandomBytes(randomNumber(8, 16)).toString("hex");

    const urlEndpoint = `/${authorID}/${randomFileID}.${availableExtension}`;

    const upload = await request(`https://${process.env.BUNNYCDN_HOSTNAME}/${process.env.BUNNYCDN_USERNAME}` + urlEndpoint, {
      method: "PUT",
      body: Buffer.from(await data.body.arrayBuffer()),
      headers: {
        "AccessKey": process.env.BUNNYCDN_PASSWORD,
        "content-type": "application/octet-stream"
      }
    });

    if (upload.statusCode >= 400) {
      console.error(`bunnyCDN upload error [${upload.statusCode}]`, await upload.body.text());
      return null;
    };

    return process.env.BUNNYCDN_ENDPOINT + urlEndpoint;
  } catch (error) {
    console.error(error);
    return null;
  };
};