import {GMDIExtension, Constants} from "oceanic.js";

export default async (client: GMDIExtension) => {
  client.editStatus("idle", [{
    type: Constants.ActivityTypes.COMPETING,
    name: "Comifuro"
  }]);

  console.log("Ready.");
};