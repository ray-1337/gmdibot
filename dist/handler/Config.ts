import ms from "ms";

const satireContext = ["tembok 🧱", "dinding 🧱", "peler 😳", "batu 🧠", "kobo 🤮", "rumput 🦗", "kaori 💀"];

export const gmdiGuildID = "190826809896468480";

export const firstGeneralTextChannelID = "190826809896468480";

export const modlogChannelID = "900578330858905601";

export const botOwnerIDs = ["331265944363991042"];

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