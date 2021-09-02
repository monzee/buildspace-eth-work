import { ReactNode, useState, useEffect, useCallback } from "react";
import { WaveApi } from "./model";
import { watch } from "./util";


function Status({ max, value, message, done }: {
  max: number
  value: number
  message: string
  done: () => void
}) {
  const isRunning = 0 < value && value < max;
  const isDone = value === max;
  const msgClasses = ["status-message"];
  if (isDone) {
    msgClasses.push("fading");
  }

  useEffect(() => {
    if (isDone) {
      let h = setTimeout(done, 5500);
      return () => clearTimeout(h);
    }
  }, [isDone, done]);

  return (
    <>
      <progress max={max} value={value} className={isRunning ? "glowing" : ""}>
      </progress>
      <div className={msgClasses.join(" ")}>
        <small>{message}</small>
      </div>
    </>
  );
}

export function Wave({ api, bail }: { api: WaveApi; bail?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const action = useCallback(async () => {
    setBusy(true);
    let newCount = await watch(api.wave(), (status) => {
      switch (status[0]) {
        case "pending":
          setStatus("awaiting user approval...");
          setProgress(1);
          break;
        case "accepted":
          setStatus("approved! mining...");
          setProgress(2);
          break;
        case "done":
          setStatus("done!");
          setBusy(false);
          setProgress(3);
          break;
        case "rejected":
          setStatus("rejected.");
          setBusy(false);
          setProgress(4);
          break;
        case "caught":
          setStatus("" + status[1]);
          setBusy(false);
          setProgress(0);
          bail?.();
          break;
      }
    });
    if (newCount) {
      setProgress(4);
      setCount(newCount);
    }
  }, [api, bail]);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus("");
  }, []);

  useEffect(() => {
    (async () => {
      let total = await api.totalWaves();
      console.info(`init: ${total}`);
      setCount(total);
    })();
  }, [api]);

  return (
    <div>
      <Status max={4} value={progress} message={status} done={reset} />
      <button onClick={action} disabled={busy}>
        <h3>
          { count === -1 ? "wave back"
          : count === 0  ? "be the first to wave!"
          : `wave back (${count})`
          }
        </h3>
      </button>
    </div>
  );
}

export function Once({ children, effect }: {
  effect: () => any
  children?: ReactNode
}) {
  useEffect(effect, [effect]);
  return <>{children}</>;
}

export function Log({ children, value, severity = "log" }: {
  value: any
  severity: "log" | "info" | "error" | "debug" | "warn"
  children?: ReactNode
}) {
  const effect = useCallback(() => {
    console[severity](value);
  }, [value, severity]);
  return (
    <Once effect={effect}>{children}</Once>
  );
}
