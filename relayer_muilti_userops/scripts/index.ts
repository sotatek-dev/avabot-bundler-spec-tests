#!/usr/bin/env node
import * as yargs from "yargs";
import chalk from "chalk";
import { init } from "./init.ts";
import { getAddress } from "./address";
import { nativeTransfer } from "./gasless/nativeTransfer";
import { nativeTransferPayERC20 } from "./erc20/nativeTransfer";
import { erc20Transfer } from "./gasless/erc20Transfer";
import { erc20TransferPayERC20 } from "./erc20/erc20Transfer";
import { mintNft } from "./gasless/mintNFT";
import { mintNftPayERC20 } from "./erc20/mintNFT";
import { batchMintNft } from "./gasless/batchMintNFT";
import { batchMintNftPayERC20 } from "./erc20/batchMintNFT";
import { batchMintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/batchMintNFT";
import { mintNftTrySponsorshipOtherwisePayERC20 } from "./hybrid-fallback/mintNFT";
import { nativeTransferWithGasPrice } from "./gasless/nativeTransferWithGasPrice.ts";
import { Wallet, providers } from "ethers";
import config from "../config.json";

function getW(idx: number) {
  const provider = new providers.JsonRpcProvider(config.rpcUrl);
  return Wallet.fromMnemonic(config.mnemonic, `m/44'/60'/0'/0/${idx}`).connect(provider);
}


yargs
  .scriptName(chalk.green("smartAccount"))
  .usage("$0 <command> [options]")
  .demandCommand(1, chalk.red.bold("You must specify a command."))
  .recommendCommands()
  // Initialize config file
  .command(
    "init",
    chalk.blue("Create a config file"),
    {
      network: {
        describe: chalk.cyan("Choose chain type"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const chainType = argv.network;
      console.log(chalk.magenta(`Initializing config for ${chainType} network`));
      init(chainType || "");
    }
  )
  // Get SmartAccount address
  .command("address", chalk.blue("Get counterfactual address"), {}, () => {
    getAddress();
  })
  // Transfer native assets (ether/matic)
  .command(
    "transfer",
    chalk.blue("Transfer native (ether/matic)"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: chalk.cyan("Amount of ether to transfer"),
        demandOption: true,
        type: "number",
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const amount = argv.amount;
      const recipientAddress = argv.to;
      console.log(chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}...`));
      if (argv.mode === "TOKEN") {
        nativeTransferPayERC20(recipientAddress, amount);
      } else {
        nativeTransfer(recipientAddress, amount);
      }
    }
  )
  // Transfer native assets (ether/matic)
  .command(
    "transferWithGasPrice",
    chalk.blue("Transfer native (ether/matic) with specify gas price"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: chalk.cyan("Amount of ether to transfer"),
        demandOption: true,
        type: "number",
      },
      bundleGasPrice: {
        describe: chalk.cyan("Gas price to be specified"),
        demandOption: true,
        type: "number",
      },
      count: {
        describe: chalk.cyan("Number count of transfer"),
        demandOption: true,
        type: "number",
      },
    },
    (argv) => {
      // const priv = [
      //   '1effd39b863c6326e787599c5580b735babe36c7e8b0a0aecf4e64a0b97eb089', //         FP-DEV Master SC Owner + Faucet
      //   "4a76d8fc578ae9d67bbd544b4d42c1117a7098b517abe0007655fab2d859346c", // MOAI Deto2 
      //   "943a00dbf19b3497b2f4e76be86e5e1737b5d7fbfe14040e96f402179b27b971", // [BCNMY] sender && MonsGame Testnet Minh
      //   '092e94c678dcc0318186544a886b479bc728cb5a54b51683b769d67a2b2e7272', // FP BSC Testnet Operator
      // ];
      const amount = argv.amount;
      const recipientAddress = argv.to;
      const bundleGasPrice = argv.bundleGasPrice;
      const count = argv.count;
      console.log(chalk.magenta(`Transferring ${amount} ether to ${recipientAddress}... with gasPrice: ${bundleGasPrice}`));
      for (let i = 0; i < count; i++) {
        nativeTransferWithGasPrice(recipientAddress, amount, bundleGasPrice, getW(i).privateKey,i);
        
      }
    }
  )
  // Transfer an ERC20 token
  .command(
    "erc20Transfer",
    chalk.blue("Transfer an ERC20 token"),
    {
      to: {
        describe: chalk.cyan("Recipient address"),
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: chalk.cyan("Amount of tokens to transfer"),
        demandOption: true,
        type: "number",
      },
      token: {
        describe: chalk.cyan("Token address"),
        demandOption: true,
        type: "string",
      },
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      const amount = argv.amount;
      const tokenAddress = argv.token;
      const recipientAddress = argv.to;
      console.log(chalk.magenta(`Transferring ${amount} tokens of ${tokenAddress} to ${recipientAddress}...`));
      if (argv.mode === "TOKEN") {
        erc20TransferPayERC20(recipientAddress, amount, tokenAddress);
      } else {
        erc20Transfer(recipientAddress, amount, tokenAddress);
      }
    }
  )
  // Mint nft token to SmartAccount
  .command(
    "mint",
    chalk.blue("Mint nft token"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      console.log(chalk.magenta("Minting an NFT token to the SmartAccount..."));
      if (argv.mode === "TOKEN") {
        mintNftPayERC20();
      } else if (argv.mode === "HYBRID") {
        mintNftTrySponsorshipOtherwisePayERC20();
      } else {
        mintNft();
      }
    }
  )
  // Batch mint nft token to SmartAccount
  .command(
    "batchMint",
    chalk.blue("Batch mint nft 2 times"),
    {
      mode: {
        describe: chalk.cyan("Paymaster mode"),
        demandOption: false,
        type: "string",
      },
    },
    (argv) => {
      console.log(chalk.magenta("Batch minting 2 NFT tokens to the SmartAccount..."));
      if (argv.mode === "TOKEN") {
        batchMintNftPayERC20();
      } else if (argv.mode === "HYBRID") {
        batchMintNftTrySponsorshipOtherwisePayERC20();
      } else {
        batchMintNft();
      }
    }
  )
  .help().argv;
