import {Client, ClientOptions} from "oceanic.js";
// import pluris from "pluris";
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
  userChat: {
    cooldown: Map<string, true>;
  };

  constructor(options: ClientOptions) {
    super(options);

    this.database = new jsoning(process.cwd() + "/database/db.json");
    this.userChat = {
      cooldown: new Map()
    };
  };
};