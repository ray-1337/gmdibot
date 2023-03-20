import {GMDIExtension, Message, EmbedOptions, AnyGuildTextChannel} from "oceanic.js";
import Config from "../config/config";
import undici from "undici";
import nodeUtil from "util";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>, args: any[]) => {
  if (!Config.botOwner.includes(message.author.id)) {
    return;
  };

  if (args.length < 1) {
    return;
  };

  const embed: EmbedOptions = {};
  let code = args.join(" "); // (interaction.data.options[0] as Eris.InteractionDataOptionsString).value;

  try {
    let output = await checkingEvaluation(code);
    embed.title = "Output";
    embed.color = 0x7289DA;

    if (output.toString().length >= 1024) {
      const request = await undici.request("https://files.blob-project.com/bin", {
        headers: {"content-type": "application/json"},
        method: "POST",
        body: JSON.stringify({ value: output })
      });

      const resJSON = await request.body.json();
      embed.description = resJSON.url;
    } else {
      if (output?.length <= 0) {
        return message.createReaction("🟢");
      } else {
        embed.description = "```js\n" + output + "```";
      };
    };
  } catch (error) {
    console.error(error)
    // let error = checkingEvaluation(err);
    embed.title = "Error";
    embed.color = 0xFF0F46;

    if (String(error).length >= 1024) {
      const request = await undici.request("https://files.blob-project.com/bin", {method: "POST", body: JSON.stringify({ value: error })});
      const resJSON = await request.body.json();
      embed.description = resJSON.url;
    } else {
      embed.description = "```js\n" + error + "```";
    };
  };

  return client.rest.channels.createMessage(message.channel.id, { embeds: [embed] });

  async function checkingEvaluation(content: any) {
    let res: any;
    try {
      res = eval(content);
      if (res && res.constructor.name == "Promise") res = await res;
    } catch (err) {
      res = err;
    };

    // if (new RegExp(`(token|secret|env)`, "gi").test(res)) return res = process.env["FAKETOKEN"];

    if (typeof res !== "string") res = nodeUtil.inspect(res, { depth: 0 });

    res = res.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));

    return res;
  };
};