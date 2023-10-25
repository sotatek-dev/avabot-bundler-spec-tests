import { BiconomySmartAccount, BiconomySmartAccountConfig } from "@biconomy/account";
import { CustomBundler } from "./customBundler";
import { ethers } from "ethers";

export class CustomSmartAccount extends BiconomySmartAccount {
  constructor(biconomySmartAccountConfig: BiconomySmartAccountConfig, private customBundler: CustomBundler) {
    super(biconomySmartAccountConfig);
  }
  // async buildUserOp(transactions: any, overrides: any, skipBundlerGasEstimation: any) {
  //   // TODO: validate to, value and data fields
  //   // TODO: validate overrides if supplied
  //   const to = transactions.map((element: any) => element.to);
  //   const data = transactions.map((element: any) => {
  //     var _a;
  //     return (_a = element.data) !== null && _a !== void 0 ? _a : "0x";
  //   });
  //   const value = transactions.map((element: any) => {
  //     var _a;
  //     return (_a = element.value) !== null && _a !== void 0 ? _a : ethers.BigNumber.from("0");
  //   });
  //   this.isProxyDefined();
  //   let callData = "";
  //   if (transactions.length === 1) {
  //     callData = this.getExecuteCallData(to[0], value[0], data[0]);
  //   } else {
  //     callData = this.getExecuteBatchCallData(to, value, data);
  //   }
  //   let nonce = ethers.BigNumber.from(0);
  //   try {
  //     nonce = await this.nonce();
  //   } catch (error) {
  //     // Not throwing this error as nonce would be 0 if this.nonce() throw exception, which is expected flow for undeployed account
  //   }
  //   let isDeployed = true;
  //   if (nonce.eq(0)) {
  //     isDeployed = await this.isAccountDeployed(this.address);
  //   }
  //   let userOp = {
  //     sender: this.address,
  //     nonce,
  //     initCode: !isDeployed ? this.initCode : "0x",
  //     callData: callData,
  //   };
  //   // for this Smart Account dummy ECDSA signature will be used to estimate gas
  //   userOp.signature = this.getDummySignature();
  //   userOp = await this.estimateUserOpGas(userOp, overrides, skipBundlerGasEstimation);
  //   // Do not populate paymasterAndData as part of buildUserOp as it may not have all necessary details
  //   userOp.paymasterAndData = "0x"; // await this.getPaymasterAndData(userOp)
  //   return userOp;
  // }

  async sendUserOp(userOp: any, sendImmediately = false, needSimulateValidation = true, sendPrivately = false) {
    delete userOp.signature;
    const userOperation = await this.signUserOp(userOp);
    const bundlerResponse = await this.sendSignedUserOp(userOperation, sendImmediately, needSimulateValidation, sendPrivately);
    return bundlerResponse;
  }

  /**
   *
   * @param userOp
   * @description This function call will take 'signedUserOp' as input and send it to the bundler
   * @returns
   */
  async sendSignedUserOp(userOp: any, sendImmediately = false, needSimulateValidation = true, sendPrivately = false) {
    const requiredFields = [
      "sender",
      "nonce",
      "initCode",
      "callData",
      "callGasLimit",
      "verificationGasLimit",
      "preVerificationGas",
      "maxFeePerGas",
      "maxPriorityFeePerGas",
      "paymasterAndData",
      "signature",
    ];
    this.isUserOpValid(userOp, requiredFields);
    if (!this.bundler) throw new Error("Bundler is not provided");
    const bundlerResponse = await this.customBundler.sendUserOp(userOp, sendImmediately, needSimulateValidation, sendPrivately);
    return bundlerResponse;
  }

  isUserOpValid(userOp: any, requiredFields: any) {
    for (const field of requiredFields) {
      if (!userOp[field]) {
        throw new Error(`${field} is missing`);
      }
    }
    return true;
  }
}
