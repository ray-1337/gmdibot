import ms from "ms";

const satireContext = ["tembok 🧱", "dinding 🧱", "peler 😳", "batu 🧠", "kobo 🤮", "rumput 🦗", "kaori 💀"];

export const staffRoleIDs: string[] = [
  "1091378943971561553", // Owner
  "907227861969166376", // Founder
  "434936406960242709", // Co-owner
  "217296828339585026" // Staff
];

export const roles = {
  booster: "589643758564540417",
  unverified: "1276683650565668874",
  member: "312868594549653514",
  birthday: "780975504068444265"
};

export const channel = {
  general: "190826809896468480",
  starboard: "1293711489164775515",
  inviteLink: "774609047013163029",
  modlog: "900578330858905601",
  verification: "1276229374043099146",
  verificationLog: "1276271108017881220"
};

export const gmdiGuildID = "190826809896468480";

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