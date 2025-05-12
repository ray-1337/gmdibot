import { type ModalSubmitInteraction, ComponentTypes, EmbedField } from "oceanic.js";
import { stripIndents } from "common-tags";

import userCollection from "@/registry/verification/userCollection";

import { extractDiscordID, isDiscordIDValid } from "@/handler/Util";

export default async (interaction: ModalSubmitInteraction) => {
  try {
    const client = interaction.client;

    await interaction.defer(64);

    const [channelID, messageID] = interaction.data.customID.split(/\-/gim).slice(1);
    if (!isDiscordIDValid(channelID) || !isDiscordIDValid(messageID)) {
      return interaction.createFollowup({ content: "Invalid secondary ID from interaction.", flags: 64 });
    };

    const reason = interaction.data.components.getTextInput("reason", true);
    if (!reason?.length) {
      return interaction.createFollowup({ content: "Invalid reason.", flags: 64 });
    };

    const logMessage = await client.rest.channels.getMessage(channelID, messageID);
    const embed = logMessage?.embeds?.[0] || null;
    if (!logMessage || !embed?.author?.name) {
      return interaction.createFollowup({ content: "Unable to fetch previous log message.", flags: 64 });
    };

    const userID = extractDiscordID(embed.author.name);
    if (!userID) {
      return interaction.createFollowup({ content: "Unable to fetch user ID from previous embed.", flags: 64 });
    };

    const userDoc = userCollection.doc(userID);

    let fields: EmbedField[] = [...embed?.fields || []];

    fields = fields.concat([
      {
        name: "Rejection Reason",
        value: reason
      },
      {
        name: "Rejected by",
        value: `@${interaction.user.username} (${interaction.user.id})`
      }
    ]);

    await client.rest.channels.editMessage(channelID, messageID, {
      components: [{
        type: ComponentTypes.ACTION_ROW,
        components: [
          logMessage.components[0].components[logMessage.components[0].components.length - 1]
        ]
      }],

      embeds: [{
        ...embed,
        color: 0xeb4634,
        title: "New User Verification (Rejected)",
        timestamp: new Date().toISOString(),
        fields
      }]
    });

    try {
      const channel = await client.rest.channels.createDM(userID);

      await channel.createMessage({
        content: stripIndents(`
        Mohon maaf, verifikasi Anda untuk bergabung ke server Discord kami ditolak dengan alasan berikut.
        > *${reason}*
      `)
      });
    } catch { };

    await userDoc.delete({ exists: true });

    return await interaction.createFollowup({ content: "Rejected.", flags: 64 });
  } catch (error) {
    console.error(error);
  };
};