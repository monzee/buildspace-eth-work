import React from "react";
import { WaveClient } from "./component";
import { useAppModel } from "./model";
import "./App.css";


function App() {
  const { when, reset } = useAppModel();
  return (
    <div className="App">
      <header className="App-header">
        <div className="card">
          {when({
            noEthereum: () => (<>
              <h1>No <code>ethereum</code> object found.</h1>
              <h3>Install MetaMask!</h3>
            </>),

            checking: () => (
              <h1>Please wait...</h1>
            ),

            connected: (api) => (<>
              <h1 className="gigantic">hello!</h1>
              <WaveClient api={api} bail={reset} />
            </>),

            notConnected: (connect) => (<>
              <h1>No authorized account found.</h1>
              <button onClick={connect}>
                <h3>Connect wallet</h3>
              </button>
            </>),

            wrongNetwork: (chain) => (<>
              <h1>⚠️ Wrong network!</h1>
              <p>
                Please switch to the <strong>Rinkeby</strong> test network
                to continue.
              </p>
            </>),

            failed: (reason, rollback) => {
              console.error(reason);
              rollback();
              return null;
            },
          })}
        </div>
      </header>
    </div>
  );
}

export default App;
