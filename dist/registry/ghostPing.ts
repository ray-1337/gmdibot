import {GMDIExtension, Message, AnyGuildTextChannel, JSONMessage, EmbedOptions, CreateMessageOptions, User} from "oceanic.js";
import * as Util from "../handler/Util";
import Config from "../config/config";
import ms from "ms";
// import Cache from "node-cache";

const standardOldMessageTime = ms("5m");
const ignoreCheckingKey = "ignoreChecking";

export type Endeavour = Array<{ messageID: string, mentioned: string[] }>;
let endeavour: Endeavour = [];

// export function cache(channelID: string, userID: string) {
//   const expireTime = Math.round(standardOldMessageTime / 1000);
//   const cache = new Cache({checkperiod: 60, deleteOnExpire: true, stdTTL: expireTime});
//   const cacheKey = `proceedWarningGhostPing_${channelID}_${userID}`;

//   const get = () => (cache.get(cacheKey) as boolean | null) || false;
//   const set = () => cache.set(cacheKey, true, expireTime);
//   const del = () => get() ? cache.del(cacheKey) : null;

//   return {get, set, del};
// };

export default async (client: GMDIExtension, msg: Message<AnyGuildTextChannel> | DeletedMessage, oldMessage?: JSONMessage | null) => {
  try {
    // check message
    let message = await Util.transformMessage(client, msg);
    if (!message || message.author.bot || message.guildID !== Config.guildID) return;

    // ignore category
    let ignoredCategory = ["759298776656510998", "360450207386828810", "627808236015190017", "954290819886612480", "535466115459973120"];
    if (message.channel.parentID && ignoredCategory.includes(message.channel.parentID)) {
      return;
    };

    // ignore if its not existed
    // if (!cache(message.channel.id, message.author.id).get()) {
    //   return;
    // };

    // ignore old message more than an hour
    if (Math.floor(Date.now() - new Date(message.timestamp).getTime()) > standardOldMessageTime) {
      return;
    };

    let ignored = await immediateIgnore(client, message.id);
    if (ignored) return;

    if (oldMessage && isOldMessageEditedAndNoTag(oldMessage)) {
      return await client.database.push(ignoreCheckingKey, message.id);
    };

    const mentionableRoleIds = (message.channel?.guild?.roles || await client.rest.guilds.getRoles(message.guildID)).filter(val => val.mentionable).map(role => role.id);
    let nonErisMessage = {
      id: message.id,
      authorId: message.author.id,
      userMentions: (message.mentions.users).map(user => ({ id: user.id, bot: user.bot })),
      mentionedRoleIds: message.mentions.roles
    };

    let nonErisPreviousMessage: GhostPingMessage | undefined = undefined;
    if (oldMessage) {
      nonErisPreviousMessage = {
        id: message.id,
        authorId: message.author.id,
        userMentions: (oldMessage.mentions.users).map(user => ({ id: user.id, bot: user.bot })),
        mentionedRoleIds: oldMessage.mentions.roles
      }
    };

    const result = handleGhostPingEvent(
      endeavour,
      mentionableRoleIds,
      nonErisMessage,
      nonErisPreviousMessage
    );

    if (result == undefined) {
      return;
    };

    const embed: EmbedOptions = {
      timestamp: new Date().toISOString(),
      author: {
        name: `Ghost Ping dari: ${message.author.username}#${message.author.discriminator}`,
        iconURL: message.author.avatarURL("png", 32)
      }
    };

    let ctx: CreateMessageOptions = {
      embeds: [embed],

      messageReference: {
        messageID: message.id,
        failIfNotExists: false
      },

      allowedMentions: {
        users: true,
        repliedUser: true,
        everyone: false,
        roles: false
      }
    };

    if (oldMessage) {
      embed.color = 0xF29C3F;
      if (oldMessage.content) embed.description = oldMessage.content;
    } else {
      embed.color = 0xF53131;
      if (message.content) embed.description = message.content;
    };

    if (result.userAnnouncedIds.length) {
      ctx.content = result.userAnnouncedIds.map(userID => `<@!${userID}>`).join(" ");
    };

    await client.rest.channels.createMessage(message.channel.id, ctx);

  } catch (error) {
    return console.error(error);
  };
};

function mentionsFiltering(users: Array<User>, userID: string) {
  return users.filter(val => val.id !== userID && !val.bot);
};

function getDeletedMentionIds(oldMentionIds: string[], newMentionIds: string[]) {
  return oldMentionIds.filter(x => !newMentionIds.includes(x));
};

export async function checkMentions(client: GMDIExtension, message: Message<AnyGuildTextChannel>) {
  let hasMentions: boolean = false;
  let variant: string[] = [];

  // check user mentions
  const UserMention = mentionsFiltering(message.mentions.users, message.author.id); // depressing filter func
  if (UserMention.length >= 1) {
    variant = UserMention.map(val => val.mention);
    hasMentions = true;
  };

  // check role mentions
  const RoleMention = message.mentions.roles;
  if (RoleMention.length >= 1 && !hasMentions) {
    let rolesMentionable = (message.channel?.guild?.roles || await client.rest.guilds.getRoles(message.guildID!)).filter(val => val.mentionable);
    let check = rolesMentionable.some(val => RoleMention.includes(val.id));

    hasMentions = check;
  };

  return { hasMentions, variant };
};

export async function immediateIgnore(client: GMDIExtension, messageID: string) {
  const check = await client.database.get(ignoreCheckingKey) as string[] | null;
  if (!check?.find(val => val == messageID)) {
    return false;
  } else {
    return true;
  };
};

function isOldMessageEditedAndNoTag(oldMessage: JSONMessage | null) {
  return oldMessage !== null && !oldMessage.editedTimestamp && (!oldMessage.mentions.roles.length && !oldMessage.mentions.users.length);
}

// export async function removalForth(client: GMDIExtension, message: Message<GuildTextableChannel>) {
//   let current = await checkMentions(client, message);
//   if (current.hasMentions) {
//     cache(message.channel.id, message.author.id).set();
//   };
// };

export type GhostPingUserMention = { id: string, bot?: boolean };
export type GhostPingMessage = { id: string, authorId: string, userMentions: GhostPingUserMention[], mentionedRoleIds: string[] };
export type GhostPing = { userAnnouncedIds: string[] };

export function handleGhostPingEvent(
  currentEndeavour: Endeavour,
  mentionableRoleIds: string[],
  message: GhostPingMessage,
  previousMessage?: GhostPingMessage): GhostPing | undefined {

  if (previousMessage != undefined) {
    const previousUserMentionIds = mentionsFilteringOffline(previousMessage.userMentions, previousMessage.authorId).map(mention => mention.id);
    const currentUserMentionIds = mentionsFilteringOffline(message.userMentions, message.authorId).map(mention => mention.id);
    const deletedUserMentionIds = getDeletedMentionIds(previousUserMentionIds, currentUserMentionIds);

    const deletedRoleMentionIds = getDeletedMentionIds(
      previousMessage.mentionedRoleIds,
      message.mentionedRoleIds
    ).filter(id => mentionableRoleIds.includes(id));

    if (deletedUserMentionIds.length + deletedRoleMentionIds.length == 0) {
      return;
    } else {
      let currentEndeavourElement = currentEndeavour.find(val => val.messageID == message.id);
      let previousMentioned = currentEndeavourElement?.mentioned || previousUserMentionIds;
      let ghostMentionedIds = previousMentioned.filter(mention => deletedUserMentionIds.includes(mention));
      let currentMentioned = previousMentioned.filter(mention => ghostMentionedIds.includes(mention));
      if (currentMentioned.length) {
        if (!currentEndeavourElement) {
          currentEndeavour.push({ messageID: message.id, mentioned: currentMentioned });
        } else {
          currentEndeavourElement.mentioned = currentMentioned;
        }
      };

      return { userAnnouncedIds: ghostMentionedIds };
    };

  }

  // from messageDelete(pure)
  else {
    const check = checkMentionsOffline(mentionableRoleIds, message);
    if (!check.hasMentions) {
      return;
    }

    return { userAnnouncedIds: check.ghostMentionedIds }
  };
};

function checkMentionsOffline(mentionableRoleIds: string[], message: GhostPingMessage) {
  let hasMentions: boolean = false;
  let ghostMentionedIds: string[] = [];

  // check user mentions
  const userMentions = mentionsFilteringOffline(message.userMentions, message.authorId);
  if (userMentions.length >= 1) {
    ghostMentionedIds = userMentions.map(val => val.id);
    hasMentions = true;
  };

  // check role mentions
  const mentionedRoleIds = message.mentionedRoleIds;
  if (mentionedRoleIds.length >= 1 && !hasMentions) {
    let check = mentionableRoleIds.some(id => mentionedRoleIds.includes(id));
    hasMentions = check;
  };

  return { hasMentions, ghostMentionedIds };
};

function mentionsFilteringOffline(userMentions: GhostPingUserMention[], userID: string) {
  return userMentions.filter(val => val.id !== userID && !val.bot);
};