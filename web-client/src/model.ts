import { useState, useRef, useEffect } from "react";
import { ethers, ContractTransaction, ContractReceipt } from "ethers";
import { WavePortal, WavePortal__factory } from "./contract";
import { Sum } from "./util";


const eth = (window as any).ethereum;
const address = "0x77AC8952e1f24cd20c812E43BcCe10826a3F6d5A";

export type TxnProgress =
  | [tag: "pending"]
  | [tag: "rejected"]
  | [tag: "accepted", transaction: ContractTransaction]
  | [tag: "done", receipt: ContractReceipt]
  | [tag: "caught", error: any]

export type WaveApi = {
  wave(): AsyncIterator<TxnProgress, number | undefined>
  totalWaves(): Promise<number>
}

export type State = {
  reset(): void
  when: Sum<{
    noEthereum: []
    checking: []
    connected: [account: string, api: WaveApi]
    notConnected: [connect: () => void]
    failed: [reason: any, rollback: () => void]
  }>
}

export function useAppModel(): State {
  type EthMethod = "eth_requestAccounts" | "eth_accounts";
  type Internal =
    | { tag: "no-eth" }
    | { tag: "checking" }
    | { tag: "found"; account: string; api: WaveApi }
    | { tag: "no-accounts" }
    | { tag: "caught"; error: any; lastGood: Internal };

  const init: Internal = { tag: eth ? "checking" : "no-eth" };
  const [state, setState] = useState<Internal>(init);

  const my = useRef({
    async connect(method: EthMethod) {
      try {
        let accounts = await eth.request({ method });
        if (accounts.length) {
          let provider = new ethers.providers.Web3Provider(eth);
          let signer = provider.getSigner();
          let contract = WavePortal__factory.connect(address, signer);
          setState({
            tag: "found",
            account: accounts[0],
            api: my.api(contract),
          });
        }
        else {
          setState({ tag: "no-accounts" });
        }
      }
      catch (error) {
        setState((lastGood) => ({ tag: "caught", error, lastGood }));
      }
    },

    start() {
      eth && my.connect("eth_accounts");
      setState(init);
    },

    api: (contract: WavePortal) => ({
      async *wave(): AsyncGenerator<TxnProgress, number | undefined> {
        try {
          yield ["pending"];
          let txn = await contract.wave();
          yield ["accepted", txn];
          let receipt = await txn.wait();
          yield ["done", receipt];
          return this.totalWaves();
        }
        catch (error) {
          if ((error as any).code === 4001) {
            yield ["rejected"];
          }
          else {
            yield ["caught", error];
            setState((lastGood) => ({ tag: "caught", error, lastGood }));
          }
        }
      },

      async totalWaves() {
        try {
          let bignum = await contract.totalWaves();
          return bignum.toNumber();
        }
        catch (error) {
          setState((lastGood) => ({ tag: "caught", error, lastGood }));
          return -1;
        }
      },
    })
  }).current;

  useEffect(() => my.start(), [my]);

  return {
    reset: my.start,
    when(visitor) {
      switch (state.tag) {
        case "no-eth":
          return visitor.noEthereum();
        case "checking":
          return visitor.checking();
        case "found":
          return visitor.connected(state.account, state.api);
        case "no-accounts":
          return visitor.notConnected(() => my.connect("eth_requestAccounts"));
        case "caught":
          return visitor.failed(state.error, () => setState(state.lastGood));
      }
    }
  };
}
