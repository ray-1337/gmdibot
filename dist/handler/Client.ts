import {Client, ClientOptions} from "oceanic.js";
// import pluris from "pluris";
import Cache from "node-cache";
import jsoning from "jsoning";

// pluris(Eris, {
//   awaitMessages: true,
//   awaitReactions: false,
//   createDMMessage: false,
//   embed: true,
//   endpoints: false,
//   messageGuild: false,
//   roleList: false,
//   webhooks: false
// });

export default class GMDIBot extends Client {
  database: jsoning;
  cache = new Cache({deleteOnExpire: true, checkperiod: 30});
  counter: {
    state: Map<"prepping" | "previousUser", any>;
    userError: Map<string, number>;
  };
  userChat: {
    cooldown: Map<string, true>;
  };

  constructor(options: ClientOptions) {
    super(options);

    this.database = new jsoning(process.cwd() + "/database/db.json");
    this.cache = this.cache;
    this.userChat = {
      cooldown: new Map()
    };
    this.counter = {
      state: new Map(),
      userError: new Map()
    };
  };
};