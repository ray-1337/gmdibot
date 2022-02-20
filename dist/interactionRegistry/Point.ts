import Eris from "eris";
import db from "quick.db";
import Config from "../config/config";

export default async (client: Eris.Client, interaction: Eris.CommandInteraction) => {
  await interaction.defer();

  let userChatDB: UserChatInterface = db.get(`userChatRate.${interaction.user?.id}`);
  if (!userChatDB) return interaction.createMessage("Not yet generated. Try to stay active.");

  return interaction.createMessage({
    content: `Your point (in order to get Active Members role): **${Math.floor(userChatDB?.probability || 0)}%** out of **${Config.userChat.meta.threshold}%**`
  });
};