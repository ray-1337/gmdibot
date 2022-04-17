import Eris from "eris";
import dayjs from "dayjs";
import similarity from "string-similarity";
import Util from "../handler/Util";

export default async (client: Eris.Client, message: Eris.Message) => {
  const currentTime = dayjs().tz("Asia/Jakarta");
  const util = new Util();

  if (currentTime.get("date") == 17 && currentTime.get("month") == 3 && currentTime.get("year") == 2022) {
    // exclude bot owner
    if (message.author.id == "331265944363991042") return;

    // remove
    let sanitizedContent = message.content.toLowerCase().replace(/[^a-zA-Z0-9\s]/gi, "").split(/\W/gi);
    if (sanitizedContent.length <= 0) return;

    let redcatString = ["redcat", "r3dc4t", "r3dcat", "redc4t", "redket", "r3dk3t", "r3dkat", "redkat"];

    for (let word of sanitizedContent) {
      let checkSimilarity = similarity.findBestMatch(word, redcatString);
      let checkViaRegex = new RegExp("(" + redcatString.join("|") + ")", "gi");
      if (word.match(checkViaRegex) || checkSimilarity.bestMatch.rating >= 0.8) {
        setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => {}), util.getRandomInt(1000, 10000));
        break;
      };

      continue;
    };
  };
};