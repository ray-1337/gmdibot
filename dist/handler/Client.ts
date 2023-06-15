import {Client, ClientOptions} from "oceanic.js";
import jsoning from "jsoning";
import * as Utility from "./Util";

export default class GMDIBot extends Client {
  database: jsoning;
  utility: typeof Utility;

  constructor(options: ClientOptions) {
    super(options);

    this.database = new jsoning(process.cwd() + "/database/db.json");
    this.utility = Utility;
  };
};