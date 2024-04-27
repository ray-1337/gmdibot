import {Client, Message, AnyTextableGuildChannel, JSONMessage, PossiblyUncachedMessage, CreateMessageOptions, User} from "oceanic.js";
import { transformMessage, usernameHandle } from "../handler/Util";
import { gmdiGuildID, ignoredCategoryToPerformGhostPing } from "../handler/Config";
import ms from "ms";
import { EmbedBuilder } from "@oceanicjs/builders";

const standardOldMessageTime = ms("5m");

const ghostPings = new Set<string>();

export type Endeavour = Array<{ messageID: string, mentioned: string[] }>;
let endeavour: Endeavour = [];

export default async (client: Client, msg: PossiblyUncachedMessage, oldMessage?: JSONMessage | null) => {
  try {
    // check message
    let message = await transformMessage(client, msg);
    if (!(message instanceof Message) || !message?.channel || message.author.bot || message.guildID !== gmdiGuildID) return;

    // ignore category
    if (message.channel.parentID && ignoredCategoryToPerformGhostPing.includes(message.channel.parentID)) {
      return;
    };

    // ignore old message more than 5 mins
    if (Math.floor(Date.now() - new Date(message.timestamp).getTime()) > standardOldMessageTime) {
      return;
    };

    if (ghostPings.has(message.id)) {
      return;
    };

    if (oldMessage && isOldMessageEditedAndNoTag(oldMessage)) {
      return ghostPings.add(message.id);
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

    const embed = new EmbedBuilder()
    .setTimestamp(new Date)
    .setAuthor(`Ghost Ping dari: ${usernameHandle(message.author)}`, message.author.avatarURL("png", 32))

    let ctx: CreateMessageOptions = {
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
      embed.setColor(0xF29C3F);
      if (oldMessage.content) embed.setDescription(oldMessage.content);
    } else {
      embed.setColor(0xF53131);
      if (message.content) embed.setDescription(message.content);
    };

    if (message?.attachments?.size) {
      const firstAttachment = message.attachments.first();
      if (firstAttachment?.url && firstAttachment?.contentType?.startsWith("image")) {
        embed.setImage(firstAttachment.url);
      }
    } else if (oldMessage?.attachments?.[0]?.url && oldMessage.attachments[0].contentType?.startsWith("image")) {
      embed.setImage(oldMessage.attachments[0].url);
    };

    if (result.userAnnouncedIds.length) {
      ctx.content = result.userAnnouncedIds.map(userID => `<@!${userID}>`).join(" ");
    };

    const deletedMessage = await client.rest.channels.createMessage(message.channel.id, {
      ...ctx,
      embeds: embed.toJSON(true)
    });

    if (deletedMessage) {
      const timeout = ms("15m");
      setTimeout(() => deletedMessage.delete("Tidak diperlukan lagi.").catch(() => {}), timeout);
    };

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

export async function checkMentions(client: Client, message: Message<AnyTextableGuildChannel>) {
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

function isOldMessageEditedAndNoTag(oldMessage: JSONMessage | null) {
  return oldMessage !== null && !oldMessage.editedTimestamp && (!oldMessage.mentions.roles.length && !oldMessage.mentions.users.length);
}

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