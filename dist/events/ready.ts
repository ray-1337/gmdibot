import {GMDIExtension, Constants} from "oceanic.js";

export default async (client: GMDIExtension) => {
  client.editStatus("dnd", []);
  console.log("Ready.");
};