import Eris from "eris";
import AntiRedcat from "../factory/RedcatPrevention";

export default async (client: Eris.Client, message: Eris.Message, oldMessage: Eris.OldMessage) => {
  AntiRedcat(client, message);
};