import Eris from "eris";
import dayjs from "dayjs";
import similarity from "string-similarity";
import Util from "../handler/Util";
import { normalizeText } from "normalize-text";
import * as tf from "@tensorflow/tfjs";
import * as tfNode from "@tensorflow/tfjs-node";
import undici from "undici";
import foldToAscii from "fold-to-ascii";

async function isRedcat(url: string) {
  tf.engine().startScope();

  let image = await undici.request(url, { method: "GET" }).catch(() => { });
  if (!image?.body || !image.headers["content-type"]) return null;

  let imageBuffer = Buffer.from(await image.body.arrayBuffer());
  let imageData: tf.Tensor3D;

  switch (true) {
    // png
    case /image\/png/gi.test(image.headers["content-type"]):
      // imageData = pngS.decode(imageBuffer);
      imageData = tfNode.node.decodePng(new Uint8Array(imageBuffer), 3);
      break;

    // jpg
    case /image\/jpe?g/gi.test(image.headers["content-type"]):
      // imageData = jpgS.decode(imageBuffer, { maxMemoryUsageInMB: 1024 });
      imageData = tfNode.node.decodeJpeg(new Uint8Array(imageBuffer), 3);
      break;

    default:
      tf.engine().endScope();
      return null;
  };

  let modelURL = "https://teachablemachine.withgoogle.com/models/Skcbsa5i4";
  let model = await tfNode.loadLayersModel(`${modelURL}/model.json`);

  let model_checking = tf.tidy(() => {
    let normalized = tf.scalar(255);
    let img = imageData.toFloat().div(normalized) as tf.Tensor3D;
    let RNN = tf.image.resizeBilinear(img, [224, 224], true);
    let batched = RNN.reshape([1, 224, 224, 3]);

    return model.predictOnBatch(batched);
  }) as tf.Tensor;

  const classes = ["rc", "notRc"]

  let value_index: {value: number, index: number}[] = [];
  let values = model_checking.dataSync();

  const topK = Math.min(classes.length, values.length);

  for (let i = 0; i < values.length; i++) value_index.push({ value: values[i], index: i });

  value_index.sort((a, b) => b.value - a.value);

  const topk = new Float32Array(topK), topkI = new Int32Array(topK);

  for (let i = 0; i < topK; i++) {
    topk[i] = value_index[i].value;
    topkI[i] = value_index[i].index;
  };

  imageData.dispose();
  tf.dispose(model_checking);

  return { className: classes[topkI[0]], probability: topk[0] };
};

export default async (client: Eris.Client, message: Eris.Message) => {
  const currentTime = dayjs().tz("Asia/Jakarta");
  const util = new Util();

  if (currentTime.get("date") == 17 && currentTime.get("month") == 3 && currentTime.get("year") == 2022) {
    // exclude bot owner
    if (message.author.id == "331265944363991042") return;

    // remove
    let redcatString = ["redcat", "r3dc4t", "r3dcat", "redc4t", "redket", "r3dk3t", "r3dkat", "redkat", "redcet", "rdkt"];
    let redcatRegex = new RegExp("(" + redcatString.join("|") + ")", "gi");
    let httpRegex = /^http(s)?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/gi;

    let deleteCooldown = util.getRandomInt(1000, 3000);
    let redcatAIThreshold = 80;

    let URLRegex = message.content.match(httpRegex);
    if (URLRegex?.length) {
      for await (let url of URLRegex) {
        let predictRedCat = await isRedcat(url);
        if (predictRedCat && predictRedCat.className == "rc" && Math.round(predictRedCat.probability * 100) > redcatAIThreshold) {
          setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => { }), deleteCooldown);
          break;
        };
      };
    }

    if (message.attachments.length) {
      for await (let attachment of message.attachments) {
        let predictRedCat = await isRedcat(attachment.proxy_url);
        if (predictRedCat && predictRedCat.className == "rc" && Math.round(predictRedCat.probability * 100) > redcatAIThreshold) {
          setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => { }), deleteCooldown);
          break;
        };
      };
    };

    if (message.embeds.length) {
      for await (let embed of message.embeds) {
        if (embed.type == "image" && embed.url) {
          let predictRedCat = await isRedcat(embed.url);
          if (predictRedCat && predictRedCat.className == "rc" && Math.round(predictRedCat.probability * 100) > redcatAIThreshold) {
            setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => { }), deleteCooldown);
            break;
          };
        };
      };
    };

    let sanitizedContent = message.content.toLowerCase().split(/\s/gi);
    if (sanitizedContent.length <= 0) return;

    for (let word of sanitizedContent) {
      let sanitizedWord = foldToAscii.foldMaintaining(normalizeText(word));
      let checkSimilarity = similarity.findBestMatch(sanitizedWord, redcatString);
      if (
        (word.replace(/\W/gi, "").match(redcatRegex) || sanitizedWord.match(redcatRegex)) ||
        checkSimilarity.bestMatch.rating >= 0.61
      ) {
        setTimeout(() => client.deleteMessage(message.channel.id, message.id).catch(() => { }), deleteCooldown);
        break;
      };

      continue;
    };
  };
};