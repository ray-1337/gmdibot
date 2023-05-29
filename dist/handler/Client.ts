import {Client, ClientOptions} from "oceanic.js";
import jsoning from "jsoning";

export default class GMDIBot extends Client {
  database: jsoning;

  constructor(options: ClientOptions) {
    super(options);

    this.database = new jsoning(process.cwd() + "/database/db.json");
  };
};