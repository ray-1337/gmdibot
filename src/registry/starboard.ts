import { Constants, Client, Message, type AnyTextableGuildChannel, type PartialEmoji, Member, type Uncached, type User, type MessageActionRow, type MessageAttachment, type File, type EmbedOptions } from "oceanic.js";
import ms from "ms";
import { EmbedBuilder } from "@oceanicjs/builders";
import { randomBytes } from "node:crypto";

import { transformMessage, truncate, randomNumber, usernameHandle } from "../handler/Util";
import { firestore } from "../handler/Firebase";
import { redis } from "../handler/Redis";
import { channel } from "../handler/Config";

const [minStar, maxStar] = [6, 9];
const starEmoji = "⭐";
const maxStarboardedMessageDays = ms("90d");
const maximumEmbedContentsLength: number = 4;
const channelID = channel.starboard;

const collectionName: string = "starboard";
const getLegacyCollection = (messageId: string) => firestore.collection(collectionName).doc(messageId);

// message older than Dec 17, 2025 will be ignored
const breakingChangesDate = new Date("Dec 17 2025").getTime();

export default async (client: Client, msg: Message<AnyTextableGuildChannel>, _: PartialEmoji, reactor: Uncached | User | Member) => {
  try {
    if (
      !msg?.channel?.guildID || !msg.channel.id || // must be presented
      (reactor instanceof Member && reactor.bot) // not a bot
    ) {
      return;
    };

    // check message
    let message = await transformMessage(client, msg);
    if (
      !message?.channel || // text channel must be presented
      message.channel.id === channelID // not in "starboard" channel
    ) {
      return;
    };

    const messageId = message.id;

    const currentTime = Date.now();
    const messageCreationTime = message.createdAt;
    const messageCreationTimeInEpoch = messageCreationTime.getTime();
    const isLegacyMessage = messageCreationTimeInEpoch <= breakingChangesDate;
    if ((currentTime - messageCreationTimeInEpoch) > maxStarboardedMessageDays) {
      // must be at least < 90 days
      return;
    };

    const reactions = await message.getReactions(starEmoji);
    const filteredReactions = reactions.filter(user => user.id !== message.author.id || !user.bot);
    let data: StarboardProp | null = null;

    let legacyDocument: ReturnType<typeof getLegacyCollection> | null = null;
    if (isLegacyMessage) {
      legacyDocument = getLegacyCollection(messageId);
    };

    if (filteredReactions.length > 0) {
      const earlyReaction = reactions?.[0] as User;
      const reactorID = earlyReaction.id;

      const starCount = randomNumber(minStar, maxStar);

      const _data: StarboardProp = { 
        reactorID, starCount
      };

      // legacy
      if (isLegacyMessage && legacyDocument !== null) {
        const starboardDoc = await legacyDocument.get();
        if (!starboardDoc.exists) {
          await legacyDocument.set(_data);
        };
      } else { // updated
        await redis.hset<StarboardProp>(collectionName, {
          [messageId]: _data
        });
      };

      data = _data;
    };

    if (filteredReactions.length <= 0) {
      if (isLegacyMessage && legacyDocument !== null) {
        const starboardDoc = await legacyDocument.get();
        if (starboardDoc.exists) {
          await legacyDocument.delete();
        };
      } else {
        await redis.hdel(collectionName, messageId);
      };

      // immediately return
      return;
    };
    
    if (!data || (filteredReactions.length < data.starCount)) {
      return;
    };

    const userTag = usernameHandle(message.author);

    let embed = new EmbedBuilder()
      .setColor(0xffac33)
      .setTimestamp(messageCreationTime)
      .setDescription(truncate(message.content, 1024))
      .setAuthor(`${userTag} (${message.author.id})`, message.author.avatarURL("png", 16));

    if (typeof data?.reactorID === "string") {
      const starterUser = client.users.get(data.reactorID) || await client.rest.users.get(data.reactorID);
      if (starterUser) {
        embed.setFooter(`Si Pemulai: ${usernameHandle(starterUser)}`);
      };
    };

    let redirectButton: MessageActionRow[] = [{
      type: Constants.ComponentTypes.ACTION_ROW,
      components: [{
        type: Constants.ComponentTypes.BUTTON,
        style: Constants.ButtonStyles.LINK,
        label: "Dokumen Asli",
        url: message.jumpLink
      }]
    }];

    // listing
    const attachments = message.attachments.toArray();
    const embeds = message.embeds ?? [];
    const [currentAttachment, currentEmbed] = [
      attachments?.[0], embeds?.[0]
    ];

    const markAsPosted = async () => {
      if (legacyDocument !== null) {
        await legacyDocument.update({ posted: true });
      } else {
        await redis.hset(collectionName, {
          [messageId]: {
            ...data, posted: true
          }
        });
      };

      return;
    };

    // bypass videos into a layered discord custom embed
    if (
      (currentAttachment?.contentType?.startsWith("video")) ||
      (currentEmbed?.type === "video" || currentEmbed?.type === "gifv")
    ) {
      const url = new URL("https://dce.cdn.13373333.one");
      url.searchParams.append("description", `${userTag} (${message.author.id})`);
      url.searchParams.append("title", truncate(message.content, 512));
      url.searchParams.append("embedColor", `#FFAC33`);

      const videoURL = currentAttachment?.url || currentEmbed?.video?.url || currentEmbed?.url;
      
      if (typeof videoURL === "string") {
        url.searchParams.append("videoURL", videoURL);

        await Promise.all([
          client.rest.channels.createMessage(channelID, {
            components: redirectButton,
            content: `[Embed](${url.toString()})`
          }),

          markAsPosted()
        ]);

        return;
      };
    };

    let contents: Array<{ url: string; contentType?: string; }> = [];

    if (attachments.length > 0) {
      attachments.forEach(attachment => {
        if (!attachment?.url) {
          return;
        };

        contents.push({
          contentType: attachment?.contentType,
          url: attachment.url
        });
      });
    };

    if (embeds.length > 0) {
      embeds.forEach(embed => {
        if (embed?.type !== "image" || typeof embed.image?.url !== "string") {
          return;
        };

        contents.push({ url: embed.image.url });
      });
    };

    if (contents.length > maximumEmbedContentsLength) {
      contents = contents.slice(0, maximumEmbedContentsLength);
    };

    let _attachments: MessageAttachment[] = [];
    let _files: File[] = [];
    const _embeds: EmbedOptions[] = [];

    for (const arrangedContent of contents) {
      const _embed = EmbedBuilder.loadFromJSON(embed.toJSON());

      const url = new URL(arrangedContent.url);
      const ext = url.pathname.split(/\//gim).pop()?.split(/\./gim)?.pop();
      if (!ext || typeof ext !== "string") continue;

      const request = await fetch(arrangedContent.url);
      if (!request.ok) continue;

      const contents = Buffer.from(await request.arrayBuffer());
      const name = [randomBytes(6).toString("base64url"), ext].join(".");

      _attachments.push({ filename: name });
      _files.push({ name, contents });

      _embed.setImage(`attachment://${name}`);
      _embeds.push(_embed.toJSON());
    };

    _attachments = _attachments.map((data, index) => ({ ...data, id: index + 1 }));
    _files = _files.map((data, index) => ({ ...data, index: index + 1 }));

    await client.rest.channels.createMessage(channelID, {
      embeds: _embeds.length <= 0 ? embed.toJSON(true) : _embeds,
      components: redirectButton,
      ...(contents.length > 0 && ({
        files: _files,
        attachments: _attachments
      }))
    });

    await markAsPosted();
  } catch (error) {
    console.error(error);
  };

  return;
};

export interface StarboardProp {
  reactorID: string;
  starCount: number;

  posted?: boolean;
};