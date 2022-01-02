import Eris from "eris";
import Util from "../handler/Util";
import centra from "centra";
import {stripIndents} from "common-tags";
import config from "../config";
import fs from "fs";

const util = new Util();

export = async (client: Eris.Client, message: Eris.Message) => {
  if (message.author.bot) return;

  const embed = new Eris.RichEmbed().setColor(0x242424).setTitle("Deleted Content")
  .setAuthor(`${message.author.username}#${message.author.discriminator}`, undefined, message.author.dynamicAvatarURL("png", 128))
  .addField("User Information", stripIndents`
  **Channel:** ${message.channel.mention}
  **Caption:** ${util.truncate(message.content, 64) || "[none#]"}
  **User ID:** ${message.author.id}`);

  let defaultHashLength: number = 9;
  let videoRegexMimeType: RegExp = /^(video)\/.*/gi;
  let listDeletedContent: string[] = [];
  let mainEndpoint = config.endpoint.contentLogging;

  if (message.attachments && message.attachments.length >= 1) {
    if (message.attachments.length === 1) {
      let extension = util.contentTypeDecide(message.attachments[0].content_type!);
      if (extension == null) return;

      let generatedFileName = `${message.author.id}.${util.generateHash(defaultHashLength)}.${extension}`;

      embed.addField("Backup Endpoint", mainEndpoint + generatedFileName);
      
      if (!videoRegexMimeType.test(message.attachments[0].content_type!)) embed.setImage(message.attachments[0].proxy_url);

      centra(message.attachments[0].proxy_url, "GET").send()
      .then(res => fs.writeFileSync(`/home/ray/gmdi-server/content/${generatedFileName}`, res.body))
      .catch(console.error);
    }

    else if (message.attachments.length > 1) {
      for (let content of message.attachments) {
        let extension = util.contentTypeDecide(message.attachments[0].content_type!);
        if (extension == null) continue;

        let generatedFileName = `${message.author.id}.${util.generateHash(defaultHashLength)}.${extension}`;

        centra(content.proxy_url, "GET").send()
        .then(res => fs.writeFileSync(`/home/ray/gmdi-server/content/${generatedFileName}`, res.body))
        .catch(console.error);

        listDeletedContent.push(mainEndpoint + generatedFileName);
      };

      embed.addField(`Backup Endpoint (Total: ${listDeletedContent.length})`, listDeletedContent.map(x => `- ${x}`).join("\n"))
    };
  }

  else return;

  // work in progress.
  // if (message.embeds) {
  // };

  return client.createMessage(config.channel.modlog, {embeds: [embed]});
};