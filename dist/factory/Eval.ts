import Eris from "eris";
import Config from "../config/config";
import undici from "undici";
import nodeUtil from "util";

export = async (client: Eris.Client, message: Eris.Message, args: any[]) => {
  if (message.author.id !== Config.botOwner) {
    return client.createMessage(message.channel.id, `Only the developer (${Config.botOwner}) can access this.`);
  };

  if (args.length < 1) {
    return client.createMessage(message.channel.id, "Some content were missing. Please try again.");
  };

  const embed = new Eris.RichEmbed();
  let code = args.join(" "); // (interaction.data.options[0] as Eris.InteractionDataOptionsString).value;

  try {
    let output = await checkingEvaluation(code);
    embed.setTitle("Output:").setColor(0x7289DA);

    if (output.toString().length >= 1024) {
      const request = await undici.request("https://files.blob-project.com/bin", {method: "POST", body: JSON.stringify({ value: output })});
      const resJSON = await request.body.json();
      embed.setDescription(resJSON.url);
    } else {
      embed.setDescription("```js\n" + output + "```");
    };
  } catch (err) {
    let error = checkingEvaluation(err);
    embed.setTitle("Error:").setColor(0xFF0F46);

    if (error.toString().length >= 1024) {
      const request = await undici.request("https://files.blob-project.com/bin", {method: "POST", body: JSON.stringify({ value: error })});
      const resJSON = await request.body.json();
      embed.setDescription(resJSON.url);
    } else {
      embed.setDescription("```js\n" + error + "```");
    };
  };

  return client.createMessage(message.channel.id, { embeds: [embed] });

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