import fetch from "node-fetch";
import { auth } from "./config/config.js";
import { Client, Intents, MessageEmbed, MessageAttachment } from "discord.js";
import { addTxHashesToDB } from "./bot.js";
import dotenv from "dotenv";
import sharp from "sharp";
dotenv.config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
}); //create new client

const T = auth();
let success = true;

const createMessageEmbed = (tweetObject, attachment, hdUrl) => {
  let marketPlacePhraseFinal;
  const marketPlacePhraseOpenSea = `[View on OpenSea](https://opensea.io/assets/0x177ef8787ceb5d4596b6f011df08c86eb84380dc/${tweetObject.tokenId})`;
  const marketPlacePhraseLooksRare = `[View on LooksRare](https://looksrare.org/collections/0x177EF8787CEb5D4596b6f011df08C86eb84380dC/${tweetObject.tokenId})`;

  if (tweetObject.marketPlace === "OpenSea") {
    marketPlacePhraseFinal = marketPlacePhraseOpenSea;
  } else if (tweetObject.marketPlace === "LooksRare") {
    marketPlacePhraseFinal = marketPlacePhraseLooksRare;
  }

  const msgEmbed = new MessageEmbed()
    .setTitle(
      `${
        tweetObject.bundle
          ? `Smilesss #${tweetObject.tokenId} was bought in a bundle that had a total cost of ${tweetObject.price} ($${tweetObject.usdPrice}) on ${tweetObject.marketPlace}`
          : `Smileesss #${tweetObject.tokenId} was bought for ${tweetObject.price} ($${tweetObject.usdPrice}) on ${tweetObject.marketPlace}`
      }`
    )
    .addField(
      "Seller",
      `[${tweetObject.fromAddress}](https://opensea.io/${tweetObject.fromAddress})`,
      true
    )
    .addField(
      "Buyer",
      `[${tweetObject.toAddress}](https://opensea.io/${tweetObject.toAddress})`,
      true
    )
    .addField("OpenSea", marketPlacePhraseFinal, false)
    .addField("6K Link", `[6k Link](${hdUrl})`);

  return msgEmbed;
};

const sendTweets = async (tweetObjects) => {
  while (tweetObjects.length > 0) {
    try {
      const { tokenId } = tweetObjects[0];
      const response = await fetch(
        `https://api.smilesss.com/metadata/smilesssvrs/${tokenId}`
      );
      const metadata = await response.json();

      let metadata1;

      await new Promise((r) => setTimeout(r, 2000));
      if (process.env.PFPS === "true") {
        const response1 = await fetch(
          `http://api.smilesss.com/metadata/smilesssvrs/pfp/${tokenId}`
        );
        metadata1 = await response1.json();
      } else {
        const response1 = await fetch(
          `https://api.smilesss.com/metadata/smilesssvrs/${tokenId}`
        );
        metadata1 = await response1.json();
      }

      console.log("---------------saving picture---------------");
      const [b64Content, buffer, b64Content1, buffer1] = await savePhotoFromAPI(
        metadata.image,
        metadata1.image
      );
      tweetObjects[0].imageUrl = metadata.image;
      const attachment = new MessageAttachment(buffer, "favicon.png");
      const attachment1 = new MessageAttachment(buffer1, "favicon.png");
      const msgEmbed = createMessageEmbed(
        tweetObjects[0],
        attachment,
        metadata.image
      );

      if (!success) {
        break;
      }
      if (process.env.SEND_TWEET === "true") {
        console.log("---------------send tweet---------------");
        const result = await postTweet(tweetObjects[0], b64Content, b64Content1);
        if (!result) {
          break;
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (process.env.SEND_DISCORD === "true") {
        console.log("---------------send discord message---------------");
        await new Promise((r) => setTimeout(r, 2000));
        await new Promise((r) => setTimeout(r, 2000));

        const channelProd = await client.channels.cache.get(
          "911007274598813716"
        );

        if (process.env.PFPS === "true") {
          await channelProd.send({
            embeds: [msgEmbed],
            files: [attachment, attachment1]
          });
        } else {
          await channelProd.send({
            embeds: [msgEmbed],
            files: [attachment]
          });
        }
      }
      const dbResponse = await addTxHashesToDB(tweetObjects.shift());

      if (!dbResponse) {
        break;
      }

      await new Promise((r) => setTimeout(r, 45000));
    } catch (e) {
      success = false;
      console.log(e);
      await new Promise((r) => setTimeout(r, 10000));
      throw "there was an error";
    }
  }
};

const postTweet = async (tweetObject, b64content1, b64content2) => {
  let marketPlacePhraseFinal;
  const marketPlacePhraseOpenSea = `https://opensea.io/assets/0x177ef8787ceb5d4596b6f011df08c86eb84380dc/${tweetObject.tokenId}`;
  const marketPlacePhraseLooksRare = `https://looksrare.org/collections/0x177EF8787CEb5D4596b6f011df08C86eb84380dC/${tweetObject.tokenId}`;

  if (tweetObject.marketPlace === "OpenSea") {
    marketPlacePhraseFinal = marketPlacePhraseOpenSea;
  } else if (tweetObject.marketPlace === "LooksRare") {
    marketPlacePhraseFinal = marketPlacePhraseLooksRare;
  }

  let statusObj = {
    status: `${
      tweetObject.bundle
        ? `Smilesss #${tweetObject.tokenId} was bought in a bundle on ${tweetObject.marketPlace} that had a total cost of ${tweetObject.price} ($${tweetObject.usdPrice})`
        : `Smilesss #${tweetObject.tokenId} was bought for ${tweetObject.price} ($${tweetObject.usdPrice}) on ${tweetObject.marketPlace}`
    }
        \n
        \n${marketPlacePhraseFinal}
        \n${Math.random().toString(36).substring(7)}`
  };
  try {
    if (process.env.PFPS === "true") {
      const mediaUpload1 = await T.post("media/upload", {
        media_data: b64content1
      });
      const mediaIdString1 = mediaUpload1.data.media_id_string;

      const mediaUpload2 = await T.post("media/upload", {
        media_data: b64content2
      });

      const mediaIdString2 = mediaUpload2.data.media_id_string;

      const mediaMetaDataCreate1 = await T.post("media/metadata/create", {
        media_id: mediaIdString1,
        alt_text: {
          text: "image description1"
        }
      });

      const mediaMetaDataCreate2 = await T.post("media/metadata/create", {
        media_id: mediaIdString2,
        alt_text: {
          text: "image description2"
        }
      });

      const response = await T.post("statuses/update", {
        status: statusObj.status,
        media_ids: [mediaIdString1, mediaIdString2]
      });
    } else {
      const mediaUpload1 = await T.post("media/upload", {
        media_data: b64content1
      });
      const mediaIdString1 = mediaUpload1.data.media_id_string;

      const mediaMetaDataCreate1 = await T.post("media/metadata/create", {
        media_id: mediaIdString1,
        alt_text: {
          text: "image description1"
        }
      });

      const response = await T.post("statuses/update", {
        status: statusObj.status,
        media_ids: [mediaIdString1]
      });
    }

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

async function savePhotoFromAPI(imageUrl1, imageUrl2) {
  console.log("Start creating buffer for 1");
  const imageResponse1 = await fetch(imageUrl1);
  const arrayBuffer1 = await imageResponse1.arrayBuffer();
  const buffer1 = Buffer.from(arrayBuffer1);
  const data1 = await sharp(buffer1).webp({ quality: 50 }).toBuffer();
  const b641 = data1.toString("base64");
  const newBuffer1 = Buffer.from(b641, "base64");

  console.log("created buffer for 1");
  console.log("waiting two seconds");
  await new Promise((r) => setTimeout(r, 2000));

  const imageResponse2 = await fetch(imageUrl2);
  const arrayBuffer2 = await imageResponse2.arrayBuffer();
  const buffer2 = Buffer.from(arrayBuffer2);
  const data2 = await sharp(buffer2).webp({ quality: 50 }).toBuffer();
  const b642 = data2.toString("base64");
  const newBuffer2 = Buffer.from(b642, "base64");

  console.log("finished creating buffer for both");
  return [b641, newBuffer1, b642, newBuffer2];
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.CLIENT_TOKEN);
export { sendTweets };
