import { Message, PossiblyUncachedMessage, Client, type Embed, Attachment } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { channel } from "../handler/Config";
import { randomNumber, truncate, usernameHandle, delay } from "../handler/Util";
import { randomBytes } from "crypto";

const [cdnHostname, cdnUsername, cdnAuthKey, cdnEndpointDomain] = (process.env.BUNNYCDN_KEY as string).split(" | ");

export default async function (client: Client, message: PossiblyUncachedMessage) {
  if (!(message instanceof Message) || message?.author?.bot === true) return;

  try {
    const attachments: Array<Embed | Attachment> = [...message.attachments.toArray(), ...(message.embeds ?? [])];
    if (attachments.length <= 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setTimestamp(message.createdAt)
      .setAuthor(`${usernameHandle(message.author)} (${message.author.id})`, message.author.avatarURL("webp", 128));

    if (message.content.length > 0) {
      embed.addField("Caption", truncate(message.content, 1024));
    };

    let listDeletedContent: string[] = [];
    let embedImageStatus: boolean = false;

    for (const content of attachments) {
      const url = content instanceof Attachment ? content.proxyURL : (content.video?.proxyURL ?? content.image?.proxyURL);
      if (!url || typeof url !== "string") continue;

      const uploadedContent = await uploadToCDN(message.author.id, url);
      if (uploadedContent !== null) {
        listDeletedContent.push(uploadedContent.url);

        if (!embedImageStatus && uploadedContent.contentType.startsWith("image")) {
          embed.setImage(uploadedContent.url);
          embedImageStatus = true;
        };
      };

      await delay(randomNumber(1250, 2500));
    };

    if (listDeletedContent.length > 0) {
      embed.addField(`Endpoints (${listDeletedContent.length})`, listDeletedContent.map(x => `- ${x}`).join("\n"));

      return client.rest.channels.createMessage(channel.modlog, {
        embeds: embed.toJSON(true)
      });
    };
  } catch (error) {
    return console.error(error);
  };
};

async function uploadToCDN(authorID: string, url: string): Promise<Record<"url" | "contentType", string> | null> {
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

    const randomFileID = randomBytes(10).toString("base64url");

    const urlEndpoint = `${authorID}/${randomFileID}.${availableExtension}`;

    const upload = await fetch(`https://${cdnHostname}/${cdnUsername}/` + urlEndpoint, {
      method: "PUT",
      body: Buffer.from(await data.arrayBuffer()),
      headers: {
        "AccessKey": cdnAuthKey as string,
        "content-type": "application/octet-stream"
      }
    });

    if (upload.status >= 400) {
      console.error(`bunnyCDN upload error [${upload.status}]`, await upload.text());
      return null;
    };

    return {
      url: "https://" + cdnEndpointDomain + "/" + urlEndpoint,
      contentType
    };
  } catch (error) {
    console.error(error);
    return null;
  };
};