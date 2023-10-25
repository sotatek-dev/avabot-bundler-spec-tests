import { providers } from "ethers";
import { IEntryPoint__factory } from "./EntryPoint__factory";

export function entryPointContract(provider: providers.JsonRpcProvider) {
  return IEntryPoint__factory.connect('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', provider);
}