import Eris from "eris";
import Util from "../handler/Util";
import centra from "centra";
import { stripIndents } from "common-tags";
import config from "../config";
import fs from "fs";

const util = new Util();

export = async (client: Eris.Client, message: Eris.Message) => {
  try {
    if (!message || message.member?.user.bot) return;

    const embed = new Eris.RichEmbed().setColor(0x242424).setTitle("Deleted Content")
      .setAuthor(`${message.member?.user.username}#${message.member?.user.discriminator}`, undefined, message.member?.user.dynamicAvatarURL("png", 128))
      .addField("User Information", stripIndents`
      **Channel:** ${message.channel.mention}
      ${message.content?.length > 0 ? `**Caption:** ${util.truncate(message.content, 64)}` : ""}
      **User ID:** ${message.member?.user.id}`);

    let defaultHashLength: number = 9;
    let videoRegexMimeType: RegExp = /^(video)\/.*/gi;
    let listDeletedContent: string[] = [];
    let mainEndpoint = config.endpoint.contentLogging;

    if (message.attachments && message.attachments.length >= 1) {
      if (message.attachments.length === 1) {
        let extension = util.contentTypeDecide(message.attachments[0].content_type!);
        if (extension == null) return;

        let generatedFileName = `${message.member?.user.id}.${util.generateHash(defaultHashLength)}.${extension}`;

        embed.addField("Backup Endpoint", mainEndpoint + generatedFileName);

        if (!videoRegexMimeType.test(message.attachments[0].content_type!)) embed.setImage(message.attachments[0].proxy_url);

        centra(message.attachments[0].proxy_url, "GET").send()
          .then(res => {
            let stream = fs.createWriteStream(`/home/ray/gmdi-server/content/${generatedFileName}`);
            stream.once('open', () => {
              stream.write(Buffer.from(res.body));
              stream.end();
            });
          })
          .catch(console.error);
      }

      else if (message.attachments.length > 1) {
        for (let content of message.attachments) {
          let extension = util.contentTypeDecide(message.attachments[0].content_type!);
          if (extension == null) continue;

          let generatedFileName = `${message.member?.user.id}.${util.generateHash(defaultHashLength)}.${extension}`;

          centra(content.proxy_url, "GET").send()
            .then(res => {
              // fs.writeFileSync(`/home/ray/gmdi-server/content/${generatedFileName}`, Buffer.from(res.body))
              let stream = fs.createWriteStream(`/home/ray/gmdi-server/content/${generatedFileName}`);
              stream.once('open', () => {
                stream.write(Buffer.from(res.body));
                stream.end();
              });
            })
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

    return client.createMessage(config.channel.modlog, { embeds: [embed] });
  } catch (error) {
    console.error(error);
  };
};