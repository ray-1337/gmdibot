import Eris from "eris";
import pluris from "pluris";
import Cache from "node-cache";

pluris(Eris, {
  awaitMessages: true,
  awaitReactions: false,
  createDMMessage: false,
  embed: true,
  endpoints: false,
  messageGuild: false,
  roleList: false,
  webhooks: false
});

export default class GMDIBot extends Eris.Client {
  cache = new Cache({deleteOnExpire: true, checkperiod: 30});
  counter: {
    state: Map<"prepping" | "previousUser", any>;
    userError: Map<string, number>;
  };

  constructor(token: string, options: Eris.ClientOptions) {
    super(token, options);

    this.cache = this.cache;
    this.counter = {
      state: new Map(),
      userError: new Map()
    };
  };
};