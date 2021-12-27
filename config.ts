const command = process.argv.slice(2);

export default {
  guildID: "190826809896468480",
  channel: {
    general: "190826809896468480",
    modlog: "900578330858905601",
    onewordstory: ["581048023950426142", "581045521507155969"],
    watchChannelModeration: command[0] === "--dev" ? ["459637978269220864"] : ["190826809896468480", "460816462941126666", "460420164551442432"]
  },
  endpoint: {
    contentLogging: "https://gmdi-content-logging.13373333.one/"
  },
  role: {
    staff: ["230305455975432193", "217296828339585026", "434936406960242709", "198442983668973568"]
  },
  cooldown: {
    limit: {
      exceed: 30, // 25,
      cooling: 20 // 15
    },

    message: {
      exceed: [
        "Saatnya slowmode!",
        "Ribut banget..."
      ],

      cooling: [
        "Oke, udah gak ribut, saatnya matiin slowmode-nya~",
        "Hore, udah sedikit kalem!"
      ]
    },

    timeout: 35000,
    timerange: 60000
  },
  cache: {
    limit: 40
  }
};