import * as ethers from 'ethers';

export const transformUserOP = (userOp: any) => {
  try {
    const userOperation = { ...userOp };
    const keys = ["nonce", "callGasLimit", "verificationGasLimit", "preVerificationGas", "maxFeePerGas", "maxPriorityFeePerGas"];
    for (const key of keys) {
      if (userOperation[key] && userOperation[key] !== "0") {
        userOperation[key] = ethers.BigNumber.from(userOp[key]).toHexString();
      }
    }
    return userOperation;
  } catch (error) {
    console.error(`Failed to transform user operation: ${error}`);
    throw error;
  }
};
