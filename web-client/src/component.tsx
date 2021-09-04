import { useState, useEffect, useCallback, useRef } from "react";
import { WaveApi, Wave } from "./model";
import { tick, formatDate } from "./util";


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

export function WaveClient({ api, bail }: { api: WaveApi; bail?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [, setIsTyping] = useState(false);
  const [waves, setWaves] = useState<Wave[]>([]);
  const msgField = useRef<HTMLInputElement>(null);
  const count = waves.length;

  const action = useCallback(async (msg: string) => {
    if (!msg.length) {
      setStatus("say something!");
      setProgress(10);
      return;
    }
    setBusy(true);
    let fakeProgress!: ReturnType<typeof setInterval>;
    for await (let status of api.wave(msg)) {
      switch (status[0]) {
        case "pending":
          setStatus("awaiting user approval...");
          setProgress(2.5);
          break;
        case "accepted":
          setStatus("approved! mining...");
          setProgress(5);
          fakeProgress = setInterval(
            tick((i) => setProgress(10 - 20 / (5 + i * i))),
            2500
          );
          break;
        case "done":
          setStatus("done!");
          setProgress(10);
          break;
        case "denied":
          setStatus("rejected.");
          setProgress(10);
          break;
        case "panic":
          setStatus("" + status[1]);
          setProgress(0);
          bail?.();
          break;
      }
    }
    clearInterval(fakeProgress);
    setBusy(false);
  }, [api, bail]);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus("");
    setIsTyping((flag) => {
      if (!flag) {
        setMessage("");
      }
      return flag;
    });
  }, []);

  useEffect(() => {
    api.allWaves().then(setWaves);
    return api.subscribe((newWave) => setWaves((xs) => [...xs, newWave]));
  }, [api]);

  return (
    <form onSubmit={(ev) => {
      ev.preventDefault();
      if (!busy) {
        action(message);
        msgField.current?.blur();
      }
    }}>
      <input
        className="my-message"
        placeholder="how do you do?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={() => setIsTyping(true)}
        onBlur={() => setIsTyping(false)}
        ref={msgField}
      />
      <Status max={10} value={progress} message={status} done={reset} />
      <button type="submit" disabled={busy}>
        <h3>wave back{count ? ` (${count})` : ""}</h3>
      </button>
      {count ? (
        <section className="waves">
          {waves.map(({ waver, message, timestamp }, i) => (
            <div className="wave" key={i}>
              <p className="message">{message}</p>
              <p className="meta">
                <span>{formatDate(timestamp)}</span>
                <span>🏆 {waver}</span>
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </form>
  );
}

