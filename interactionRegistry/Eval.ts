import Eris from "eris";
import Config from "../config";
import centra from "centra";
import nodeUtil from "util";

export = async (client: Eris.Client, interaction: Eris.CommandInteraction) => {
  await interaction.defer();

  if (interaction.member?.id !== Config.botOwner) {
    return interaction.createMessage("Only the developer can access this.");
  };

  if (!interaction || !interaction.data || !interaction.data.options) {
    return interaction.createMessage("Some content were missing. Please try again.");
  };

  const embed = new Eris.RichEmbed();
  let code = (interaction.data.options[0] as Eris.InteractionDataOptionsString).value;

  try {
    let output = await checkingEvaluation(code);
    embed.setTitle("Output:").setColor(0x7289DA);

    if (output.toString().length >= 1024) {
      const request = await centra("https://files.blob-project.com/bin", "POST").body({ value: output }, "json").send();
      const result = JSON.parse(Buffer.from(request.body).toString());
      embed.setDescription(result.url);
    } else {
      embed.setDescription("```js\n" + output + "```");
    };
  } catch (err) {
    let error = checkingEvaluation(err);
    embed.setTitle("Error:").setColor(0xFF0F46);

    if (error.toString().length >= 1024) {
      const request = await centra("https://files.blob-project.com/bin", "POST").body({ value: error }, "json").send();
      const result = JSON.parse(Buffer.from(request.body).toString());
      embed.setDescription(result.url);
    } else {
      embed.setDescription("```js\n" + error + "```");
    };
  };

  return interaction.createMessage({ embeds: [embed] });

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