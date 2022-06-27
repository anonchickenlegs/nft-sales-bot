import { main } from "./utils/blockchain_utils.js";
import pkg from "pg";
import { sendTweets } from "./message_send.js";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;
let client;
if (process.env.NODE_ENV === "development") {
  client = new Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });
}

client.connect();

const crossReferenceIdsFromDatabaseAndOpenSeaSales = async (sales) => {
  try {
    const tweetObjects = [];
    let txHashes = [];

    sales.forEach((sale) => {
      txHashes.push(`'${sale.txHash}'`);
    });

    const txHashesString = txHashes.join(",");
    //find the event_ids that have already been tweeted.  If it's empty that means none have been tweeted
    console.log(
      "---------------checking if transactions in db already:---------------"
    );
    console.log(txHashesString);
    const queryText = `select tx_hash from transactions where tx_hash in (${txHashesString})`;
    const queryResponse = await client.query(queryText);
    const seen = {};
    //place them into an hash for fast lookup
    queryResponse.rows.forEach((row) => {
      seen[row.tx_hash] = true;
    });

    //filter out the ones that have already been tweeted and add the ones that haven't been tweeted to tweet object
    console.log("---------------transactions:---------------");
    console.log(txHashes);
    console.log("---------------seen:---------------");
    console.log(seen);

    sales.forEach((sale) => {
      if (!seen[sale.txHash]) {
        tweetObjects.push(sale);
      }
    });

    if (tweetObjects.length > 0) {
      console.log("---------------sending worker information---------------");
      await sendTweets(tweetObjects);
    }
  } catch {
    console.log(
      "---------------there was an error sending info to worker ---------------"
    );
    throw "There was an error";
  }
};

async function addTxHashesToDB(txToAdd) {
  console.log("---------------adding ids to DB---------------");
  try {
    if (txToAdd.save) {
      const queryText = `INSERT INTO transactions (tx_hash, block_number, updated_at, created_at) values ($1, $2, NOW(), NOW())`;
      await client.query(queryText, [txToAdd.txHash, txToAdd.blockNumber]);
    }
    return true;
  } catch (e) {
    console.log(e);
    console.log(
      "There was an error trying to insert transactions into the database"
    );
    return false;
  }
}

async function fetchLastBlockSeen() {
  try {
    const queryText =
      "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1;";
    const queryResponse = await client.query(queryText);
    return queryResponse.rows[0];
  } catch (e) {
    console.log(e);
    return -1;
  }
}

const fetchSalesFromEtherscan = async () => {
  console.log("---------------fetching etherscan sales---------------");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const lastBlockSeenDB = await fetchLastBlockSeen();
      console.log(lastBlockSeenDB);
      console.log("---------------fetching etherscan sales---------------");
      const sales = await main(
        lastBlockSeenDB ? lastBlockSeenDB.block_number : lastBlockSeenDB
      );
      if (!sales.length) continue;

      await crossReferenceIdsFromDatabaseAndOpenSeaSales(sales);
      await new Promise((r) => setTimeout(r, 10000));
    } catch (error) {
      console.log(
        "---------------there was an error fetching api---------------"
      );
      console.log(error);
      await new Promise((r) => setTimeout(r, 20000));
    }
  }
};
export { addTxHashesToDB };
fetchSalesFromEtherscan();
