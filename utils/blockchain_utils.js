import * as EtherscanApi from "etherscan-api";
import * as dotenv from "dotenv";
import Web3 from "web3";
const web3 = new Web3("https://cloudflare-eth.com");

let api = null;
const GenieContractAddress = "0x0a267cF51EF038fC00E71801F5a524aec06e4f07";
const LooksContractAddress = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
const LooksContractAddressToWeth1 =
  "0xe5efa11dfe58e21f505ce88b269badb6c00abb2f";
const LooksContractAddressToWeth2 =
  "0x5924a28caaf1cc016617874a2f0c3710d881f3c1";
const OpenSeaContractAddress = "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b";
const OpenSeaContractAddress2 = "0x7f268357A8c2552623316e2562D90e642bB538E5";
const OpenSeaContractAddress3 = "0x00000000006c3852cbef3e08e8df289169ede581";
const OpenSeaWalletAddress = "0x5b3256965e7C3cF26E11FCAf296DfC8807C01073";
const SmilesssContractAddress = "0x177EF8787CEb5D4596b6f011df08C86eb84380dC";
const WethContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ApeContractAddress = "0x4d224452801ACEd8B2F0aebE155379bb5D594381";
const TransferEventHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function getTransferEvents(lastSeenBlockNum) {
  // let fromBlock = parseInt("13973592", 16);
  // Here we will fetch from block from database
  let fromBlock = lastSeenBlockNum;
  let latestBlock = "latest";

  const createLogs = (
    await api.log.getLogs(
      SmilesssContractAddress, // address
      fromBlock, // fromBlock
      latestBlock, // toBlock
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,
      null // creation
    )
  ).result;
  let sales = [];
  let seenTransactions = {};

  for (
    let smilesssTransfer = 0;
    smilesssTransfer < createLogs.length;
    smilesssTransfer++
  ) {
    const innerSales = [];
    const log = createLogs[smilesssTransfer];
    const tx = (await api.proxy.eth_getTransactionByHash(log.transactionHash))
      .result;
    await new Promise((r) => setTimeout(r, 1000));
    const txReciept = (
      await api.proxy.eth_getTransactionReceipt(log.transactionHash)
    ).result;
    const logs = txReciept.logs;
    const txHash = tx.hash;
    if (seenTransactions[txHash]) {
      continue;
    }
    seenTransactions[txHash] = true;
    const txBlockNumber = parseInt(tx.blockNumber, 16);
    let wethTransaction = false;
    let apeTransaction = false;
    let price;
    let marketPlace;
    let bundle = false;
    await new Promise((r) => setTimeout(r, 1000));
    let ethStatsResp = await api.stats.ethprice();
    let usdEthPrice = ethStatsResp.result.ethusd;

    logs.forEach((log) => {
      const addressTransferringToken = log.address;
      const topics = log.topics;
      const topicFunctionHash = topics[0];
      //transfer of assets
      if (
        topicFunctionHash.toLowerCase() === TransferEventHash.toLowerCase() &&
        addressTransferringToken.toLowerCase() ===
          SmilesssContractAddress.toLowerCase()
      ) {
        const saleObj = {};
        const fromAddress = web3.eth.abi.decodeParameter("address", topics[1]);
        const toAddress = web3.eth.abi.decodeParameter("address", topics[2]);
        const tokenId = web3.eth.abi.decodeParameter("uint256", topics[3]);

        saleObj.fromAddress = fromAddress;
        saleObj.toAddress = toAddress;
        saleObj.tokenId = tokenId;

        innerSales.push(saleObj);
      }

      //for weth transactions
      if (
        topicFunctionHash.toLowerCase() === TransferEventHash.toLowerCase() &&
        addressTransferringToken.toLowerCase() ===
          WethContractAddress.toLowerCase()
      ) {
        const toAddress = web3.eth.abi.decodeParameter("address", topics[2]);

        if (
          toAddress.toLowerCase() !== OpenSeaWalletAddress.toLowerCase() &&
          toAddress.toLowerCase() !==
            LooksContractAddressToWeth1.toLowerCase() &&
          toAddress.toLowerCase() !== LooksContractAddressToWeth2.toLowerCase()
        ) {
          price = parseInt(log.data) / 10 ** 18;
          wethTransaction = true;
        }
      }

      //for ape transaction
      if (
        topicFunctionHash.toLowerCase() === TransferEventHash.toLowerCase() &&
        addressTransferringToken.toLowerCase() ===
          ApeContractAddress.toLowerCase()
      ) {
        const toAddress = web3.eth.abi.decodeParameter("address", topics[2]);

        if (
          toAddress.toLowerCase() !== OpenSeaWalletAddress.toLowerCase() &&
          toAddress.toLowerCase() !==
            LooksContractAddressToWeth1.toLowerCase() &&
          toAddress.toLowerCase() !== LooksContractAddressToWeth2.toLowerCase()
        ) {
          price = parseInt(log.data) / 10 ** 18;
          apeTransaction = true;
        }
      }

      //opensea contract
      if (
        addressTransferringToken.toLowerCase() ===
          OpenSeaContractAddress.toLowerCase() ||
        addressTransferringToken.toLowerCase() ===
          OpenSeaContractAddress2.toLowerCase() ||
        addressTransferringToken.toLowerCase() ===
          OpenSeaContractAddress3.toLowerCase()
      ) {
        if (!wethTransaction && !apeTransaction) {
          price = parseInt(tx.value) / 10 ** 18;
        }
        marketPlace = "OpenSea";
      }

      //looks rare contract
      if (
        addressTransferringToken.toLowerCase() ===
        LooksContractAddress.toLowerCase()
      ) {
        marketPlace = "LooksRare";
      }
    });
    if (price && marketPlace) {
      const transactionValue = parseInt(tx.value) / 10 ** 18;
      if (transactionValue > 0) {
        wethTransaction = false;
        apeTransaction = false;
        price = transactionValue;
      }
      if (innerSales.length > 1) {
        bundle = true;
      }
      innerSales.forEach((sale, idx) => {
        if (idx === innerSales.length - 1) {
          sale.save = true;
        } else {
          sale.save = false;
        }
        sale.bundle = bundle;
        if (wethTransaction) {
          sale.price = `${price.toFixed(3)} WETH`;
        } else if (apeTransaction) {
          sale.price = `${price.toFixed(3)} APE`;
        } else {
          sale.price = `${price.toFixed(3)} ETH`;
        }
        if (apeTransaction) {
          sale.usdPrice = "";
        } else {
          sale.usdPrice = `${(parseInt(usdEthPrice) * price).toFixed(2)}`;
        }
        sale.marketPlace = marketPlace;
        sale.txHash = txHash;
        sale.blockNumber = txBlockNumber;
      });
      sales = sales.concat(innerSales);
      console.log(sales);
    }
    console.log("waiting");
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log("finished etherscan api search");
  return sales;
}

async function init() {
  dotenv.config();
  var etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  if (!etherscanApiKey) {
    throw new Error("Missing ETHERSCAN_API_KEY");
  }
  api = EtherscanApi.init(etherscanApiKey);
}

async function main(fromBlock = "14417576") {
  try {
    await init();
    const sales = await getTransferEvents(fromBlock);
    return sales;
  } catch (error) {
    console.log(error);
  }
}

export { main };
