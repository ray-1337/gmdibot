import { Message, PossiblyUncachedMessage, Client, Embed } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { modlogChannelID } from "../handler/Config";
import { randomNumber, truncate, usernameHandle } from "../handler/Util";
import { randomBytes } from "crypto";

const [cdnHostname, cdnUsername, cdnAuthKey, cdnEndpointDomain] = (process.env.BUNNYCDN_KEY as string).split(" | ");

export default async function (client: Client, message: PossiblyUncachedMessage) {
  if (!(message instanceof Message) || !message?.author || message?.author?.bot) return;

  try {
    const embed = new EmbedBuilder()
    .setColor(0x7289DA)
    .setTimestamp(new Date())
    .setAuthor(`${usernameHandle(message.author)} (${message.author.id})`, message.author.avatarURL("webp", 128))

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
    if (!process.env?.BUNNYCDN_KEY) return null;

    let data = await fetch(url, { method: "GET" });

    const contentType = data.headers.get("content-type");
    if (!contentType) return null;

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

    const randomFileID = randomBytes(randomNumber(8, 16)).toString("hex");

    const urlEndpoint = `${authorID}/${randomFileID}.${availableExtension}`;

    const upload = await fetch(`https://${cdnHostname}/${cdnUsername}/` + urlEndpoint, {
      method: "PUT",
      body: Buffer.from(await data.arrayBuffer()),
      headers: {
        "AccessKey": cdnAuthKey,
        "content-type": "application/octet-stream"
      }
    });

    if (upload.status >= 400) {
      console.error(`bunnyCDN upload error [${upload.status}]`, await upload.text());
      return null;
    };

    return "https://" + cdnEndpointDomain + "/" + urlEndpoint;
  } catch (error) {
    console.error(error);
    return null;
  };
};