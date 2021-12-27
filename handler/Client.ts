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

  constructor(token: string, options: Eris.ClientOptions) {
    super(token, options);

    this.cache = this.cache;
  };
};