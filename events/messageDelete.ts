import Eris from "eris";

export = async (client: Eris.Client, message: Eris.Message) => {
  // console.log(message);
  client.emit("contentLogging", message);
};