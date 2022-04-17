import Eris from "eris";
import dayjs from "dayjs";
import similarity from "string-similarity";
import Util from "../handler/Util";
import { normalizeText } from "normalize-text";

export default async (client: Eris.Client, message: Eris.Message) => {
  const currentTime = dayjs().tz("Asia/Jakarta");
  const util = new Util();

  if (currentTime.get("date") == 17 && currentTime.get("month") == 3 && currentTime.get("year") == 2022) {
    // exclude bot owner
    // if (message.author.id == "331265944363991042") return;

    // remove
    let sanitizedContent = message.content.toLowerCase().replace(/[^a-zA-Z0-9\s]/gi, "").split(/\W/gi);
    if (sanitizedContent.length <= 0) return;

    let redcatString = ["redcat", "r3dc4t", "r3dcat", "redc4t", "redket", "r3dk3t", "r3dkat", "redkat"];
    let redcatEmojiString = [ '918426777318207528', '918426775741165588', '918426776647123044', '946365751802069012', '946653528062042163', '946653528108191745', '946365751445553172', '918426776559058975', '946365751311335474', '946653528393412618', '955092373073973348' ];
    let redcatConcatString = redcatString.concat(redcatEmojiString);
    let redcatRegex = new RegExp("(" + redcatConcatString.join("|") + ")", "gi");

    let deleteCooldown = util.getRandomInt(1000, 15000);
    
    if (message.attachments.length) {
      for (let attachment of message.attachments) {
        if (redcatConcatString.some(x => x.includes(attachment.filename.toLowerCase()))) {
          setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => {}), deleteCooldown);
          break;
        };
      };
    };

    for (let word of sanitizedContent) {
      let sanitizedWord = normalizeText(word);
      let checkSimilarity = similarity.findBestMatch(sanitizedWord, redcatString);
      if (sanitizedWord.match(redcatRegex) || checkSimilarity.bestMatch.rating >= 0.8) {
        setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => {}), deleteCooldown);
        break;
      };

      continue;
    };
  };
};