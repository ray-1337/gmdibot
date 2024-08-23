import ms from "ms";

const satireContext = ["tembok 🧱", "dinding 🧱", "peler 😳", "batu 🧠", "kobo 🤮", "rumput 🦗", "kaori 💀"];

export const verificationChannelID: string = process.env.npm_lifecycle_event === "dev" ? "1160715499005562912" : "1276229374043099146";
export const verificationLogChannelID: string = "1276271108017881220";

export const staffRoleID: string = "217296828339585026";

export const unverifiedRoleID: string = "1276683650565668874";

export const memberRoleID: string = "312868594549653514";

export const coblosChannelID = "905076614042370088";

export const gmdiGuildID = "190826809896468480";

export const inviteLinkChannelID = "774609047013163029";

export const birthdayRoleID: string = "780975504068444265";

export const firstGeneralTextChannelID = "190826809896468480";

export const modlogChannelID = "900578330858905601";

export const botOwnerIDs = ["331265944363991042"];

export const ignoredCategoryToPerformGhostPing = ["759298776656510998", "360450207386828810", "627808236015190017", "954290819886612480", "535466115459973120"]

export const ignoredCategoryToPerformPrivateLogging = ["360450207386828810", "954290819886612480"];

// channel cooldown related
export const mostCooldownRelevantTextChannelIDs = ["190826809896468480", "460816462941126666", "460420164551442432"];

export const [cooldownRangeCooling, cooldownRangeExceed, messagesCacheTimeRange, checkCooldownRemovalInterval] = [15, 30, ms("1m"), ms("45s")];

export const cooldownMessageExceed = [
  "ngerusuh mulu",
  "berisik lu pada",
  "sehari gausah ribut bisa gak",
  `ngomong sama ${satireContext[Math.floor(Math.random() * satireContext.length)]}`
];

export const cooldownMessageCooling = [
  "ribut mulu daritadi",
  "kata mamah jangan ribut"
];

export const evalPrefix = ".";