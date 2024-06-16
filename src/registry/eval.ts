import {Client, Message, EmbedOptions, AnyTextableGuildChannel} from "oceanic.js";
import { botOwnerIDs } from "../handler/Config";
import { inspect } from "util";

export default async (client: Client, message: Message<AnyTextableGuildChannel>, args: any[]) => {
  if (!botOwnerIDs.includes(message.author.id)) {
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

    const stringifiedOutput = output.toString();

    if (stringifiedOutput.length >= 1024) {
      return message.channel.createMessage({
        files: [{
          contents: Buffer.from(stringifiedOutput, "utf-8"),
          name: `eval_${Date.now()}.txt`
        }]
      });
    } else {
      if (stringifiedOutput?.length <= 0 || stringifiedOutput == "undefined") {
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
      return message.channel.createMessage({
        files: [{
          contents: Buffer.from(String(error), "utf-8"),
          name: `eval_${Date.now()}.txt`
        }]
      });
    } else {
      embed.description = "```js\n" + error + "```";
    };
  };

  return client.rest.channels.createMessage(message.channel.id, { embeds: [embed] });

  async function checkingEvaluation(content: any) {
    let res: any;
  
    try {
      res = eval(content);
      if (res && res.constructor.name == "Promise") {
        res = await res;
      };
    } catch (err) {
      res = err;
    };
  
    if (typeof res !== "string") {
      res = inspect(res, { depth: 0 });
    };
  
    res = res.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  
    return res;
  };
};