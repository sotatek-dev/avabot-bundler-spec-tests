import { Bundler, UserOpReceipt, UserOpResponse } from "@biconomy/bundler";
import { transformUserOP } from "./utils/HelperFunction";
import { HttpMethod, RPC_PROVIDER_URLS, deepHexlify, getTimestampInSeconds, sendRequest } from "@biconomy/common";
import { resolveProperties } from "ethers/lib/utils";
import { JsonRpcProvider } from "@ethersproject/providers";

export class CustomBundler extends Bundler {
  /**
   *
   * @param userOp
   * @description This function will send signed userOp to bundler to get mined on chain
   * @returns Promise<UserOpResponse>
   */
  async sendUserOp(userOp: any, sendImmediately = false, needSimulateValidation = true, sendPrivately = false): Promise<UserOpResponse> {
    const chainId = this.bundlerConfig.chainId;
    // transformUserOP will convert all bigNumber values to string
    userOp = transformUserOP(userOp);
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp));
    if (sendImmediately === undefined || sendImmediately === null) {
        sendImmediately = false;
    }
    if (needSimulateValidation === undefined || needSimulateValidation === null) {
        needSimulateValidation = true;
    }
    if (needSimulateValidation === undefined || needSimulateValidation === null) {
        sendPrivately = false;
    }
    const params = [
        hexifiedUserOp,
        this.bundlerConfig.entryPointAddress,
        sendImmediately,
        needSimulateValidation,
        sendPrivately,
    ];
    // const params = [
    //     hexifiedUserOp,
    //     this.bundlerConfig.entryPointAddress,
    //     sendImmediately,
    //     needSimulateValidation,
    // ];
    const bundlerUrl = this.bundlerConfig.bundlerUrl;
    const sendUserOperationResponse: any = await sendRequest({
      url: bundlerUrl,
      method: HttpMethod.Post,
      body: {
        method: "eth_sendUserOperation",
        params: params,
        id: getTimestampInSeconds(),
        jsonrpc: "2.0",
      },
    });
    const response = {
      userOpHash: sendUserOperationResponse.result,
      wait: (confirmations: any): Promise<UserOpReceipt> => {
        const provider = new JsonRpcProvider(RPC_PROVIDER_URLS[chainId]);
        return new Promise(async (resolve, reject) => {
          const intervalId = setInterval(async () => {
            try {
              const userOpResponse = await this.getUserOpReceipt(sendUserOperationResponse.result);
              if (userOpResponse && userOpResponse.receipt && userOpResponse.receipt.blockNumber) {
                if (confirmations) {
                  const latestBlock = await provider.getBlockNumber();
                  const confirmedBlocks = latestBlock - userOpResponse.receipt.blockNumber;
                  if (confirmations >= confirmedBlocks) {
                    clearInterval(intervalId);
                    resolve(userOpResponse);
                  }
                }
                clearInterval(intervalId);
                resolve(userOpResponse);
              }
            } catch (error) {
              clearInterval(intervalId);
              reject(error);
            }
          }, this.UserOpReceiptIntervals[chainId]);
        });
      },
    };
    return response;
  }
}
