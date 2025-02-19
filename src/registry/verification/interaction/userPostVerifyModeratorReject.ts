import { type ModalSubmitInteraction, ComponentTypes, EmbedField } from "oceanic.js";
import { stripIndents } from "common-tags";

import userCollection from "@/registry/verification/userCollection";

export default async (interaction: ModalSubmitInteraction) => {
  try {
    const client = interaction.client;

    await interaction.defer(64);

    const [channelID, messageID] = interaction.data.customID.split(/\-/gim).slice(1);
    if (!channelID.match(/(\d{16,21})/gim) || !messageID.match(/(\d{16,21})/gim)) {
      return interaction.createFollowup({ content: "Invalid secondary ID from interaction.", flags: 64 });
    };

    const reason = interaction.data.components.getTextInput("reason", true);
    if (!reason?.length) {
      return interaction.createFollowup({ content: "Invalid reason.", flags: 64 });
    };

    const logMessage = await client.rest.channels.getMessage(channelID, messageID);
    const embed = logMessage?.embeds?.[0] || null;
    if (!logMessage || !embed || !embed?.author) {
      return interaction.createFollowup({ content: "Unable to fetch previous log message.", flags: 64 });
    };

    const userID = embed?.author?.name.match(/(\d{15,21})/gim);
    if (!userID?.[0]) {
      return interaction.createFollowup({ content: "Unable to fetch user ID from previous embed.", flags: 64 });
    };

    const userDoc = userCollection.doc(userID[0]);

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
      const channel = await client.rest.channels.createDM(userID[0]);

      await channel.createMessage({
        content: stripIndents(`
        Mohon maaf, verifikasi Anda untuk bergabung ke server Discord kami ditolak dengan alasan berikut.
        > *${reason}*
      `)
      });
    } catch { };

    await userDoc.set({ userID: userID[0], lastUpdatedAt: Date.now() }, { merge: true });

    return await interaction.createFollowup({ content: "Rejected.", flags: 64 });
  } catch (error) {
    console.error(error);
  };
};