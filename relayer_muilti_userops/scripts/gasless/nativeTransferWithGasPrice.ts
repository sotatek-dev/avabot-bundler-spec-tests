import { ethers, Wallet } from "ethers";
import chalk from "chalk";
import {
  // BiconomySmartAccount,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
// import { Bundler } from "@biconomy/bundler";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import config from "../../config.json";
import { UserOperationWithGasPrice } from "../Types";
import { CustomBundler } from "../domains/customBundler";
import { CustomSmartAccount } from "../domains/customSmartAccount";

export const nativeTransferWithGasPrice = async (
  to: string,
  amount: number,
  bundleGasPrice: number,
  priv: string,
  idx: number
) => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//
  try {
    // get EOA address from wallet provider
    let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    let signer = new ethers.Wallet(priv, provider);
    const eoa = await signer.getAddress();

    // create bundler and paymaster instances
    const bundler = new CustomBundler({
      bundlerUrl: config.bundlerUrl,
      chainId: config.chainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    });

    const paymaster = new BiconomyPaymaster({
      paymasterUrl: config.biconomyPaymasterUrl,
    });

    // Biconomy smart account config
    // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use
    const biconomySmartAccountConfig = {
      signer: signer,
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      paymaster: paymaster,
      bundler: bundler,
    };

    const gasPrice = await provider.getGasPrice();

    // create biconomy smart account instance
    // const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
    const biconomyAccount = new CustomSmartAccount(
      biconomySmartAccountConfig,
      bundler
    );
    const biconomySmartAccount = await biconomyAccount.init({
      accountIndex: config.accountIndex,
    });
    // const aaAddr = await biconomySmartAccount.getSmartAccountAddress();

    // console.log(chalk.blue(`[${idx}] EOA address: ${eoa}`));
    // const aaBalance = await provider.getBalance(aaAddr);
    // console.log(chalk.green(`[${idx}] AA: ${aaAddr}: ${aaBalance}`));
    // if (aaBalance.lt(ethers.utils.parseEther("0.012"))) {
    //   await new Promise((resolve) => setTimeout(resolve, 3000));
    //   try {
    //     const master = new ethers.Wallet(config.privateKey, provider);

    //     console.log(chalk.yellow(idx, "gasPrice: ", gasPrice));
    //     console.log(chalk.yellow(idx, "Funding to", aaAddr));
    //     let tx = {
    //       from: master.address,
    //       to: aaAddr,
    //       data: "0x",
    //       value: ethers.utils.parseEther("0.012"),
    //       // nonce: await master.getTransactionCount("pending"),
    //       gasLimit: 21000,
    //       gasPrice: gasPrice,
    //     };

    //     const resp = await master.sendTransaction(tx);
    //     console.log(chalk.yellow(idx, "Funded to", aaAddr, "with", resp.hash));
    //   } catch (err: any) {
    //     console.error(chalk.red(`[${idx}] Error finding: ${err.message}`));
    //   }
    // }


    // const relayer = '0x12c8fEbF99C65B53158644f910B565063e967B62';
    // let relayerBal = await provider.getBalance(relayer);
    // console.log(chalk.red(`Before relayer: [${relayer} | ${relayerBal}]`));

    // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

    // transfer native asset
    // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
    // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
    // 2. If no policies are added every transaction will be sponsored by your paymaster
    // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster
    const transaction = {
      from: eoa,
      to: to || "0x0000000000000000000000000000000000000000",
      data: "0x",
      value: ethers.utils.parseEther(amount.toFixed(18)),
    };

    const transaction1 = {
      from: eoa,
      to: "0xA1DC4a79fDcc63C18e6c333b48ad5c904f89f770",
      data: "0x",
      value: ethers.utils.parseEther(amount.toFixed(18)),
    };

    // try {
    //   const nonce = await biconomyAccount.entryPoint.nonceSequenceNumber(aaAddr, 0);
    //   console.log(chalk.blue(`[nonce] = ${nonce}`));
    // } catch (err: any) {
    //   console.error(err.message, err);
    // }

    // build partial userOp
    // console.log(
    //   chalk.cyan(
    //     idx,
    //     "Transfering ",
    //     ethers.utils.parseEther(amount.toFixed())
    //   )
    // );
    // let partialUserOp = await biconomySmartAccount.buildUserOp([transaction, transaction1]);
    let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

    // ------------------------STEP 3: Get Paymaster and Data from Biconomy Paymaster --------------------------------//

    const biconomyPaymaster =
      biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

    // Here it is meant to act as Sponsorship/Verifying paymaster hence we send mode: PaymasterMode.SPONSORED which is must
    let paymasterServiceData: SponsorUserOperationDto = {
      mode: PaymasterMode.SPONSORED,
      // optional params...
      calculateGasLimits: true, // Always recommended when using paymaster
    };

    try {
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          partialUserOp,
          paymasterServiceData
        );
      partialUserOp.paymasterAndData =
        paymasterAndDataResponse.paymasterAndData;

      if (
        paymasterAndDataResponse.callGasLimit &&
        paymasterAndDataResponse.verificationGasLimit &&
        paymasterAndDataResponse.preVerificationGas
      ) {
        // Returned gas limits must be replaced in your op as you update paymasterAndData.
        // Because these are the limits paymaster service signed on to generate paymasterAndData
        // If you receive AA34 error check here..

        partialUserOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
        partialUserOp.verificationGasLimit =
          paymasterAndDataResponse.verificationGasLimit;
        partialUserOp.preVerificationGas =
          paymasterAndDataResponse.preVerificationGas;
      }
    } catch (e) {
      // console.log("error received ", e);
    }

    // ------------------------STEP 4: Sign the UserOp and send to the Bundler--------------------------------//
    // console.log(chalk.blue(`userOp: ${JSON.stringify(partialUserOp, null, "\t")}`));

    // Below function gets the signature from the user (signer provided in Biconomy Smart Account)
    // and also send the full op to attached bundler instance

    try {
      const userOp: UserOperationWithGasPrice = Object.assign(partialUserOp);
      // console.log(
      //   chalk.green(`[${idx}] userOp sender - nonce : ${userOp.sender} - ${userOp.nonce}`)
      // );
      userOp.bundleGasPrice = bundleGasPrice;
      if (bundleGasPrice) {
        userOp.maxFeePerGas = bundleGasPrice;
        userOp.maxPriorityFeePerGas = bundleGasPrice;
      }

      // Send options
      const sendImmediately = true;
      const needSimulateValidation = false;
      // const sendPrivately = true;
      const sendPrivately = false;
      console.log(chalk.blue(`[${idx}] Start send: ${new Date().getTime()}`));
      const userOpResponse = await biconomySmartAccount.sendUserOp(
        userOp,
        sendImmediately,
        needSimulateValidation,
        sendPrivately
      );

      console.log(
        chalk.green(`[${idx}] userOp Hash: ${userOpResponse.userOpHash}`)
      );
      console.log(chalk.blue(`[${idx}] End send: ${new Date().getTime()}`));
      console.log(chalk.green(`[${idx}] bundleGasPrice: ${bundleGasPrice}`));

      const transactionDetails = await userOpResponse.wait();
      console.log(
        chalk.blue(
          `[${idx}] transactionHash: ${transactionDetails.receipt.transactionHash}`
        )
      );
    } catch (e) {
      console.log(`[${idx}] |sendUserOp| Error received `, e);
    }
  } catch (e) {
    console.log(`[${idx}] |sendUserOp| Error received `, e);
  }
};
