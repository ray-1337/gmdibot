import {GMDIExtension, Message, EmbedOptions, AnyGuildTextChannel, EmbedVideo, EmbedImage} from "oceanic.js";
import * as Util from "../handler/Util";
import {request} from "undici";
import { stripIndents } from "common-tags";
import config from "../config/config";
import fs from "fs";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>) => {
  try {
    if (!message?.author || message?.author?.bot) return;

    const embed: EmbedOptions = {
      color: 0x242424,
      title: "Deleted Content",
      author: {
        name: `${message.author.username}#${message.author.discriminator}`,
        iconURL: message.author.avatarURL("png", 128)
      },
      fields: [{
        name: "User Information",
        value: stripIndents`
          **Channel:** ${message.channel.mention}
          **User ID:** ${message.author.id}
        `
      }]
    }

      if (message?.content.length) {
        embed.fields?.push({
          name: "Caption",
          value: Util.truncate(message.content, 1024)
        });
      };

    let videoRegexMimeType = /^(video)\/.*/gi;
    let acceptableEmbedsRegexType = /^(video|image)$/gi;
    let listDeletedContent: string[] = [];

    // attachments
    if (message.attachments?.size) {
      if (message.attachments.size === 1) {
        if (!message.attachments[0].content_type) return;

        let promisedStore = await contentStore(message.author.id, message.attachments[0].proxy_url, true);

        if (!videoRegexMimeType.test(message.attachments[0].content_type)) {
          if (promisedStore) {
            listDeletedContent.push(promisedStore);
            embed.image!["url"] = promisedStore;
          } else {
            embed.image!["url"] = message.attachments[0].proxy_url;
          };
        };
      }

      else if (message.attachments.size > 1) {
        for await (let content of message.attachments) {
          if (!content[1].contentType) continue;

          let promisedStore = await contentStore(message.author.id, content[1].proxyURL);
          if (promisedStore) listDeletedContent.push(promisedStore);
          
          continue;
        };
      };
    }

    // embeds
    if (message.embeds?.length) {
      if (message.embeds.length === 1) {
        if (message.embeds[0].type?.match(acceptableEmbedsRegexType)) {
          let URLDecision: EmbedVideo | EmbedImage | undefined;
          if (message.embeds[0].type == "video" && message.embeds[0].video) {
            URLDecision = message.embeds[0].video;
          } else if (message.embeds[0].type == "image" && message.embeds[0].image) {
            URLDecision = message.embeds[0].image;
          };

          if (URLDecision?.proxyURL) {
            let promisedStore = await contentStore(message.author.id, URLDecision.proxyURL, true);
            if (promisedStore) listDeletedContent.push(promisedStore);

            if (message.embeds[0].type !== "video") {
              if (promisedStore) {
                embed.image!["url"] = promisedStore;
              } else {
                embed.image!["url"] = URLDecision.proxyURL;
              };
            };
          };
        };
      }

      else if (message.embeds.length > 1) {
        for await (let embed of message.embeds) {
          if (!embed.type?.match(acceptableEmbedsRegexType)) continue;

          let URLDecision: EmbedVideo | EmbedImage | undefined;
          if (embed.type == "video" && embed.video) {
            URLDecision = embed.video;
          } else if (embed.type == "image" && embed.image) {
            URLDecision = embed.image;
          };

          if (URLDecision?.proxyURL) {
            let promisedStore = await contentStore(message.author.id, URLDecision.proxyURL);
            if (promisedStore) listDeletedContent.push(promisedStore);
          };
          
          continue;
        };
      };
    };

    if (listDeletedContent?.length) {
      embed.fields?.push({
        name: `Backup Endpoint (Total: ${listDeletedContent.length})`,
        value: listDeletedContent.map(x => `- ${x}`).join("\n")
      })
      
      return client.rest.channels.createMessage(config.channel.modlog, { embeds: [embed] });
    };
  } catch (error) {
    console.error(error);
  };
};

async function contentStore(identifier: string, url: string, returnURL?: boolean) {
  try {
    let UIDLength = Util.getRandomInt(12, 16);
    let endpoint = config.endpoint.contentLogging;
    let storagePath = "/home/ray/gmdi-content-logging/";

    let data = await request(url, { method: "GET" });
    if (!data?.headers["content-type"] || !data?.body) return;

    let extension = Util.contentTypeDecide(data.headers["content-type"]);
    if (!extension) return;

    let generatedUID = UIDGenerator(UIDLength);

    let generatedFileName = `${identifier}.${generatedUID}.${extension}`;
    let stream = fs.createWriteStream(storagePath + generatedFileName);
    
    stream.once('open', async () => {
      stream.write(Buffer.from(await data.body.arrayBuffer()));
      stream.end();
    });

    return returnURL ? `${endpoint + generatedFileName}` : `[${generatedUID}.${extension}](${endpoint + generatedFileName})`;
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