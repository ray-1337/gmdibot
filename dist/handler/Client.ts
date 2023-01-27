import {Client, ClientOptions} from "oceanic.js";
import Cache from "node-cache";

export default class GMDIBot extends Client {
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