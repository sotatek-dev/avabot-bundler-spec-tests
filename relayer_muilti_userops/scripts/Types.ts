import { UserOperation } from "@biconomy/core-types";

export type UserOperationWithGasPrice = UserOperation & {
  bundleGasPrice: number;
};
