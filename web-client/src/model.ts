import { useState, useMemo, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import { WavePortal, WavePortal__factory } from "./contract";
import { Sum, TxnProgress } from "./util";


const eth = (window as any).ethereum;
const address = "0x475D123a2b41eea79F3c72d45831c083C76De5d4";

export type Wave = {
  waver: string
  message: string
  timestamp: Date
  winner: boolean
}

export type WaveApi = {
  totalWaves(): Promise<number>
  allWaves(): Promise<Wave[]>
  wave(message: string): TxnProgress<boolean>
  onNewWave(accept: (wave: Wave) => void): () => void
}

export type State = {
  reset(): void
  when: Sum<{
    noEthereum: []
    checking: []
    connected: [api: WaveApi]
    notConnected: [connect: () => void]
    wrongNetwork: [chain: string]
    failed: [reason: any, rollback: () => void]
  }>
}

export function useAppModel(): State {
  type EthMethod = "eth_requestAccounts" | "eth_accounts"
  type Internal =
    | { tag: "no-eth" }
    | { tag: "checking" }
    | { tag: "ready"; api: WaveApi }
    | { tag: "no-accounts" }
    | { tag: "wrong-chain"; chain: string }
    | { tag: "caught"; error: any; lastGood: Internal }

  const [state, setState] = useState<Internal>({
    tag: eth ? "checking" : "no-eth"
  });

  const my = useMemo(() => ({
    async connect(method: EthMethod) {
      if (!eth) {
        setState({ tag: "no-eth" });
        return;
      }
      setState({ tag: "checking" });
      try {
        let accounts = await eth.request({ method });
        if (accounts.length) {
          let chain = await eth.request({ method: "eth_chainId" });
          if (chain === "0x4") {
            let provider = new ethers.providers.Web3Provider(eth);
            let signer = provider.getSigner();
            let contract = WavePortal__factory.connect(address, signer);
            setState({ tag: "ready", api: my.api(contract) });
          }
          else {
            setState({ tag: "wrong-chain", chain });
          }
        }
        else {
          setState({ tag: "no-accounts" });
        }
      }
      catch (error) {
        my.catch(error);
      }
    },

    start() {
      my.connect("eth_accounts");
    },

    catch(error: any) {
      setState((lastGood) => ({ tag: "caught", error, lastGood }));
    },

    onChainChange() {
      if (eth) {
        eth.on("chainChanged", my.start);
        return () => eth.removeListener("chainChanged", my.start);
      }
    },

    api: (contract: WavePortal): WaveApi => ({
      async *wave(message) {
        try {
          yield ["pending"];
          let txn = await contract.wave(message, { gasLimit: 300000 });
          yield ["accepted", txn];
          let receipt = await txn.wait();
          yield ["done", receipt];
          return receipt.events?.[0]?.args?.winner;
        }
        catch (error) {
          if ((error as any).code === 4001) {
            yield ["denied"];
          }
          else {
            my.catch(error);
            yield ["panic", error];
          }
          return false;
        }
      },

      async totalWaves() {
        try {
          let bignum = await contract.totalWaves();
          return bignum.toNumber();
        }
        catch (error) {
          my.catch(error);
          return -1;
        }
      },

      async allWaves() {
        try {
          let waves = await contract.allWaves();
          return waves.map(({ waver, message, timestamp, winner }) => ({
            waver,
            message,
            winner,
            timestamp: new Date(timestamp.toNumber() * 1000),
          }));
        }
        catch (error) {
          my.catch(error);
          return [];
        }
      },

      onNewWave(accept) {
        const dispatch = (
          message: string, waver: string, ts: BigNumber, winner: boolean
        ) => accept({
          waver,
          message,
          winner,
          timestamp: new Date(ts.toNumber() * 1000),
        });
        contract.on("NewWave", dispatch);
        return () => contract.removeListener("NewWave", dispatch);
      },
    }),
  }), []);

  useEffect(() => {
    my.start();
    return my.onChainChange();
  }, [my]);

  return {
    reset: my.start,
    when(visitor) {
      switch (state.tag) {
        case "no-eth":
          return visitor.noEthereum();
        case "checking":
          return visitor.checking();
        case "ready":
          return visitor.connected(state.api);
        case "no-accounts":
          return visitor.notConnected(() => my.connect("eth_requestAccounts"));
        case "wrong-chain":
          return visitor.wrongNetwork(state.chain);
        case "caught":
          return visitor.failed(state.error, () => setState(state.lastGood));
      }
    }
  };
}
