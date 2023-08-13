import {Client, ClientOptions} from "oceanic.js";
import * as Utility from "./Util";

export default class GMDIBot extends Client {
  utility: typeof Utility;

  constructor(options: ClientOptions) {
    super(options);

    this.utility = Utility;
  };
};