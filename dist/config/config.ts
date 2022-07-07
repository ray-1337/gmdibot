const command = process.argv.slice(2);

const satireContext = ["tembok 🧱", "dinding 🧱", "peler 😳", "batu 🧠", "kobo 🤮", "rumput 🦗", "kaori 💀"];

export default {
  guildID: "190826809896468480",
  botOwner: "331265944363991042",
  prefix: ".",
  channel: {
    general: "190826809896468480",
    modlog: "900578330858905601",
    onewordstory: ["581048023950426142", "581045521507155969"],
    watchChannelModeration: command[0] === "--dev" ? ["459637978269220864"] : ["190826809896468480", "460816462941126666", "460420164551442432"]
  },

  endpoint: {
    contentLogging: "https://gmdi-content-logging.13373333.one/"
  },

  warning: {
    role: {
      1: "265808137100066817",
      2: "265808551107231745",
      3: "438664627962904576"
    },
    channel: {
      warning: "331444579146661889", // "459221138267176971" // "331444579146661889"
      logging: "468266481445240853"
    },
    session: {
      III: {
        minRange: 30,
        maxRange: 90
      }
    }
  },

  role: {
    staff: ["230305455975432193", "217296828339585026", "434936406960242709", "198442983668973568"],
    activeUser: "782238654210768906"
  },

  cooldown: {
    limit: {
      exceed: 30,
      cooling: 15
    },

    message: {
      exceed: [
        "ngerusuh mulu",
        "berisik lu pada",
        "sehari gausah ribut bisa gak",
        `ngomong sama ${satireContext[Math.floor(Math.random() * satireContext.length)]}`
      ],

      cooling: [
        "ribut mulu daritadi",
        "kata mamah jangan ribut"
      ]
    },

    intervalCheckingTimeout: 35000,
    timerange: 60000,
    timeout: 5
  },

  cache: {
    limit: 40
  },

  counting: {
    channelID: "929657424745484288",
    dedicated: ["331265944363991042"],
    limitError: 3,
    messageCacheLimit: 5
  },

  userChat: {
    unnecessity: {
      category: [
        "712525103862120519",
        "535466115459973120",
        "460429581598588928",
        "905064326187089941",
        "769174984521547796",
        "468266060987236352",
        "627808236015190017",
        "360450207386828810",
        "759298776656510998",
        "907309690264895529"
      ],

      channel: [
        "459221138267176971", // bot command
        // "459637978269220864" // bot staff
      ]
    },

    meta: {
      threshold: 25, // percentage
      resetAfterInDay: 28
    }
  }
};