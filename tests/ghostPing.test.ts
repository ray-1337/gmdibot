import {
  handleGhostPingEvent,
  Endeavour,
  GhostPingUserMention,
  // GhostPingMessage,
  GhostPing
} from "../dist/registry/ghostPing";

type MentionedMessageConfig = {
  authorId: string,
  userMentions: GhostPingUserMention[],
  mentionedRoleIds: string[]
}

let endeavour: Endeavour;
let globalMentionableRoleIds: string[];
let allRoleMentionable: boolean;
let newEvent: GhostPing | undefined;
let messageConfigMap: {[messageId: string]: MentionedMessageConfig} = {};
let globalMessageId = 1;

function initializeEnvironment(mentionableRoleIds?: string[]) {
  endeavour = [];
  globalMentionableRoleIds = [];
  allRoleMentionable = true;
}

function setMentionableRoleIds(mentionableRoleIds: string[]) {
  globalMentionableRoleIds = mentionableRoleIds;
  allRoleMentionable = false;
}

function sendMentionedMessage(message: MentionedMessageConfig): string {
  const newMessageId = String(globalMessageId);
  messageConfigMap[newMessageId] = message;

  if (allRoleMentionable) {
    for (const roleId of message.mentionedRoleIds) {
      if (!globalMentionableRoleIds.includes(roleId)) {
        globalMentionableRoleIds.push(roleId);
      }
    }
  }
  globalMessageId++;

  return newMessageId;
}

function deleteMentionedMessage(messageId: string) {
  const message = {
    id: messageId,
    authorId: messageConfigMap[messageId].authorId,
    userMentions: messageConfigMap[messageId].userMentions,
    mentionedRoleIds: messageConfigMap[messageId].mentionedRoleIds
  }

  newEvent = handleGhostPingEvent(endeavour, globalMentionableRoleIds, message);
}

type EditMessageConfig = {
  userMentions: GhostPingUserMention[],
  mentionedRoleIds: string[]
}
function editMentionedMessage(messageId: string, messageConfig: EditMessageConfig) {
  const previousMessage = {
    id: messageId,
    authorId: messageConfigMap[messageId].authorId,
    userMentions: messageConfigMap[messageId].userMentions,
    mentionedRoleIds: messageConfigMap[messageId].mentionedRoleIds
  }

  // Edit
  messageConfigMap[messageId].userMentions = messageConfig.userMentions;
  messageConfigMap[messageId].mentionedRoleIds = messageConfig.mentionedRoleIds;
  const newMessage = {
    id: messageId,
    authorId: messageConfigMap[messageId].authorId,
    userMentions: messageConfig.userMentions,
    mentionedRoleIds: messageConfig.mentionedRoleIds
  }

  newEvent = handleGhostPingEvent(
    endeavour, globalMentionableRoleIds, newMessage, previousMessage);  
}

type ExpectGhostPingType = {
  withOnlyUserIds: (userIds: string[]) => {toBeNotified: (() => void)},
  withNoUser: {toBeNotified: (() => void)}
}

const expectGhostPing: ExpectGhostPingType = {
  withOnlyUserIds: userIDs => ({
    toBeNotified: () => {
      expect(newEvent).not.toBeUndefined();

      const announced = newEvent!.userAnnouncedIds;
      expect(announced).toHaveLength(userIDs.length);
      for (const userID of userIDs) {
        expect(announced).toContain(userID);
      }
    }
  }),
  withNoUser: {
    toBeNotified: () => {
      expectGhostPing.withOnlyUserIds([]).toBeNotified();
    }
  }
}

function expectNoGhostPing() {
  expect(newEvent).toBeUndefined();
}

// ==================
// === TEST CASES ===
// ==================

it("TC 01: Tag user, and delete", () => {
  initializeEnvironment();
  const taggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: taggedId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectGhostPing.withOnlyUserIds([taggedId]).toBeNotified();
});

it("TC 02: Tag role, and delete", () => {
  initializeEnvironment();
  const roleTaggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: [roleTaggedId]
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectGhostPing.withNoUser.toBeNotified();
});

it("TC 03: Self tag, and delete", () => {
  initializeEnvironment();
  const authorId = "1";
  const messageConfig = {
    authorId: authorId,
    userMentions: [{id: authorId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectNoGhostPing();
});

it("TC 04: Tag bot, and delete", () => {
  initializeEnvironment();
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: "2", bot: true}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectNoGhostPing();
});

it("TC 05: No tag, and delete", () => {
  initializeEnvironment();
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectNoGhostPing();
});

it("TC 06: Tag unmentionable role, and delete", () => {
  initializeEnvironment();
  setMentionableRoleIds([]);
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: ["2"]
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectNoGhostPing();
});

it("TC 07: Tag user, and remove by edit", () => {
  initializeEnvironment();
  const taggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: taggedId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectGhostPing.withOnlyUserIds([taggedId]).toBeNotified();
});

it("TC 08: Tag role, and remove by edit", () => {
  initializeEnvironment();
  const roleTaggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: [roleTaggedId]
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectGhostPing.withNoUser.toBeNotified();
});

it("TC 09: Self tag, and remove by edit", () => {
  initializeEnvironment();
  const authorId = "1";
  const messageConfig = {
    authorId: authorId,
    userMentions: [{id: authorId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectNoGhostPing();
});

it("TC 10: Tag bot, and remove by edit", () => {
  initializeEnvironment();
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: "2", bot: true}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectNoGhostPing();
});

it("TC 11: No tag, edit without tag", () => {
  initializeEnvironment();
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectNoGhostPing();
});

it("TC 12: Tag unmentionable role, and remove by edit", () => {
  initializeEnvironment();
  setMentionableRoleIds([]);
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: ["2"]
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: []
  });
  expectNoGhostPing();
});

it("TC 13: Tag user, edit but keep the tag", () => {
  initializeEnvironment();
  const taggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: taggedId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [{id: taggedId}],
    mentionedRoleIds: []
  });
  expectNoGhostPing();
});

it("TC 14: Tag role, edit but keep the tag", () => {
  initializeEnvironment();
  const roleTaggedId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: [roleTaggedId]
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [],
    mentionedRoleIds: [roleTaggedId]
  });
  expectNoGhostPing();
});

it("TC 15: Tag many users, and delete", () => {
  initializeEnvironment();
  const authorId = "1";
  const user1Id = "2";
  const user2Id = "3";
  const botId = "6";

  const messageConfig = {
    authorId: "1",
    userMentions: [{id: authorId}, {id: user1Id}, {id: user2Id}, {id: botId, bot: true}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectGhostPing.withOnlyUserIds([user1Id, user2Id]).toBeNotified();
});

it("TC 16: Tag many roles, and delete", () => {
  initializeEnvironment();
  const mentionableRoleId = "2";
  const unmentionableRoleId = "3";

  setMentionableRoleIds([mentionableRoleId]);
  const messageConfig = {
    authorId: "1",
    userMentions: [],
    mentionedRoleIds: [mentionableRoleId, unmentionableRoleId]
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectGhostPing.withNoUser.toBeNotified();
});

it("TC 17: Tag user and unmentionable role, and delete", () => {
  initializeEnvironment();
  setMentionableRoleIds([]);
  const taggedUserId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: taggedUserId}],
    mentionedRoleIds: ["7"]
  }

  const messageId = sendMentionedMessage(messageConfig);
  deleteMentionedMessage(messageId);
  expectGhostPing.withOnlyUserIds([taggedUserId]).toBeNotified();
});

it("TC 18: Tag, edit but keep the tag, and delete", () => {
  initializeEnvironment();
  setMentionableRoleIds([]);
  const taggedUserId = "2";
  const messageConfig = {
    authorId: "1",
    userMentions: [{id: taggedUserId}],
    mentionedRoleIds: []
  }

  const messageId = sendMentionedMessage(messageConfig);
  editMentionedMessage(messageId, {
    userMentions: [{id: taggedUserId}],
    mentionedRoleIds: []
  });
  expectNoGhostPing();

  deleteMentionedMessage(messageId);
  expectGhostPing.withOnlyUserIds([taggedUserId]).toBeNotified();
});

// Use for future
// it("RANDOM SEARCH", () => {
//   initializeEnvironment();
//   const mentionableRoleId = "10";
//   const unmentionableRoleId = "11";
//   setMentionableRoleIds([mentionableRoleId]);

//   const userIds = ["1", "2", "3", "4", "5"];
//   const botIds = ["6", "7"];

//   // Aksi: buat pesan, hapus pesan, edit pesan
//   // Aksi buat pesan: tag orang, bebas (termasuk dirinya sendiri), tag bot, tag role mentioned atau tidak
//   // Aksi hapus pesan: ya ... tinggal pilih pesan yang ada sekarang
//   // Aksi edit pesan: hampir sama dengan buat pesan
//   const messageIdList: string[] = [];
//   const messageAuthorMap: {[messageId: string]: string | undefined} = {};
//   const expectedUserGhostTagIds: {[messageId: string]: string[] | undefined} = {};
//   const expectedRoleGhostTagIds: {[messageId: string]: string[] | undefined} = {};

//   function getRandomUserMentions(): GhostPingUserMention[] {
//     const userMentions: GhostPingUserMention[] = [];

//     // Non-bot
//     for (const userId of userIds) {
//       if (Math.random() < 0.5) {
//         userMentions.push({id: userId});
//       }
//     }

//     // Bot
//     for (const botId of botIds) {
//       if (Math.random() < 0.5) {
//         userMentions.push({id: botId, bot: true});
//       }
//     }

//     return userMentions;
//   }

//   function getRandomRoleMentionIds(): string[] {
//     const mentionedRoleId: string[] = []; 
//     if (Math.random() < 0.5) {
//       mentionedRoleId.push(mentionableRoleId);
//     }
//     if (Math.random() < 0.5) {
//       mentionedRoleId.push(unmentionableRoleId);
//     }

//     return mentionedRoleId;
//   }

//   function getMentionableUserTagIds(mentions: GhostPingUserMention[], authorId: string) {
//     return mentions.filter(mention => !mention.bot && (mention.id != authorId))
//       .map(mention => mention.id);
//   }

//   function doRandomAction() {
//     const randomNumber = Math.random();
//     if (randomNumber < 0.34 || messageIdList.length == 0) { // Create message
//       createRandomMessage();

//     } else if (randomNumber < 0.67) { // Delete message
//       deleteRandomMessage();

//     } else { // Edit message
//       editRandomMessage();
//     }

//     function createRandomMessage() {
//       const userMentions = getRandomUserMentions();
//       const authorId = userIds[Math.floor(Math.random() * userIds.length)];
//       const expectedGhostMentionIds = getMentionableUserTagIds(userMentions, authorId);

//       const mentionedRoleIds = getRandomRoleMentionIds();
//       const expectedGhostMentionRoleIds = mentionedRoleIds.filter(id => id == mentionableRoleId);

//       const messageConfig = {
//         authorId: authorId,
//         userMentions: userMentions,
//         mentionedRoleIds: mentionedRoleIds
//       }

//       const messageId = sendMentionedMessage(messageConfig);
//       if (expectedGhostMentionIds.length + expectedGhostMentionRoleIds .length > 0) {
//         expectedUserGhostTagIds[messageId] = expectedGhostMentionIds;
//         expectedRoleGhostTagIds[messageId] = expectedGhostMentionRoleIds;
//       }
      
//       messageAuthorMap[messageId] = authorId;
//       messageIdList.push(messageId);
//     }

//     function deleteRandomMessage() {
//       const messageId = userIds[Math.floor(Math.random() * userIds.length)];
//       deleteMentionedMessage(messageId);
//       const currentExpectedGhostTagIds = expectedUserGhostTagIds[messageId];
//       if (currentExpectedGhostTagIds == undefined) {
//         expectNoGhostPing();
//       } else if (currentExpectedGhostTagIds.length == 0) {
//         expectGhostPing.withNoUser.toBeNotified();
//       } else {
//         expectGhostPing.withOnlyUserIds(currentExpectedGhostTagIds).toBeNotified();
//       }
//       expectedUserGhostTagIds[messageId] = undefined;
//       expectedRoleGhostTagIds[messageId] = undefined;
//       messageAuthorMap[messageId] = undefined;
//     }

//     function editRandomMessage() {
//       const messageId = userIds[Math.floor(Math.random() * userIds.length)];
//       const userMentions = getRandomUserMentions();
//       const mentionedRoleIds = getRandomRoleMentionIds(); 
//       editMentionedMessage(messageId, {
//         userMentions: userMentions,
//         mentionedRoleIds: mentionedRoleIds
//       });
      
//       const currentMentionableTagIds = getMentionableUserTagIds(userMentions, messageAuthorMap[messageId]!);
//       const currentMentionableRoleTagIds = mentionedRoleIds.filter(id => id == mentionableRoleId);
//       const previousExpectedGhostTagIds = expectedUserGhostTagIds[messageId];
//       const previousExpectedGhostTagRoleIds = expectedRoleGhostTagIds[messageId];
//       if (previousExpectedGhostTagIds == undefined) {
//         expectNoGhostPing();
//       } else {
//         const ghostTagIds = previousExpectedGhostTagIds.filter(id => !currentMentionableTagIds.includes(id));
//         const ghostTagRoleIds = previousExpectedGhostTagRoleIds!.filter(id => !currentMentionableRoleTagIds.includes(id));
//         if (ghostTagIds.length + ghostTagRoleIds.length == 0) {
//           expectNoGhostPing();
//         } else {
//           if (ghostTagIds.length == 0) {
//             expectGhostPing.withNoUser.toBeNotified();
//           } else {
//             expectGhostPing.withOnlyUserIds(currentMentionableTagIds).toBeNotified();
//           }

//           const nextExpectedGhostTagIds = previousExpectedGhostTagIds.filter(id => !ghostTagIds.includes(id));
//           if (nextExpectedGhostTagIds.length == 0) {
//             expectedUserGhostTagIds[messageId] = undefined;
//             expectedRoleGhostTagIds[messageId] = undefined;
//             messageAuthorMap[messageId] = undefined;
//           } else {
//             expectedUserGhostTagIds[messageId] = nextExpectedGhostTagIds;
//             expectedRoleGhostTagIds[messageId] = [];
//           }
//         }
//       }
//     }
//   }

//   for (let i=0; i < 10000; i++) {
//     doRandomAction();
//   }
// });


