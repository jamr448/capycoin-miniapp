"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState("Verifica tu identidad");
  const [tab, setTab] = useState("claim");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    MiniKit.install();
  }, []);

  // ⏱️ TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeLeft > 0) setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (t: number) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 🔐 VERIFICACIÓN
  const handleVerify = async () => {
    try {
      setStatus("🔐 Verificando...");

      const res = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      if (
        res.finalPayload?.status === "success" ||
        res.finalPayload?.status === "verified"
      ) {
        setVerified(true);
        setStatus("✅ Verificado");
      } else {
        setStatus("❌ Falló verificación");
      }
    } catch {
      setStatus("❌ Error");
    }
  };

  // 💰 CLAIM
  const handleClaim = async () => {
    try {
      setStatus("⏳ Procesando...");

      const res = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      let nullifier = "";

      if ("nullifier_hash" in res.finalPayload) {
        nullifier = res.finalPayload.nullifier_hash;
      } else if ("proofs" in res.finalPayload) {
        const proofs = res.finalPayload.proofs as any[];
        nullifier = proofs[0]?.nullifier_hash;
      }

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nullifier }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("💰 Claim exitoso!");
        setTimeLeft(86400); // 24h
      } else {
        setStatus("⛔ " + data.message);
        setTimeLeft(86400); // ejemplo fallback
      }
    } catch {
      setStatus("❌ Error en claim");
    }
  };

  // 🔒 PANTALLA DE VERIFICACIÓN
  if (!verified) {
    return (
      <main style={styles.container}>
        <h1>Capycoin</h1>
        <button style={styles.button} onClick={handleVerify}>
          Verificar identidad
        </button>
        <p>{status}</p>
      </main>
    );
  }

  // 🧩 APP PRINCIPAL
  return (
    <main style={styles.container}>
      {/* TABS */}
      <div style={styles.tabs}>
        <button onClick={() => setTab("claim")} style={styles.tab}>
          Reclamar
        </button>
        <button onClick={() => setTab("about")} style={styles.tab}>
          Acerca de
        </button>
      </div>

      {/* CONTENIDO */}
      {tab === "claim" && (
        <>
          <h2>⏱️ {formatTime(timeLeft)}</h2>

          <button style={styles.claimButton} onClick={handleClaim}>
            Reclamar
          </button>
        </>
      )}

      {tab === "about" && (
        <>
          <h2>Capycoin</h2>
          <p>Memecoin comunitaria en WorldChain 🚀</p>
        </>
      )}

      <p>{status}</p>
    </main>
  );
}

// 🎨 ESTILOS
const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: "15px 25px",
    borderRadius: "20px",
    background: "#22c55e",
    border: "none",
    color: "white",
    marginTop: "20px",
  },
  claimButton: {
    padding: "20px",
    borderRadius: "30px",
    background: "#0ea5e9",
    border: "none",
    color: "white",
    marginTop: "40px",
    width: "200px",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#1e293b",
    color: "white",
    border: "none",
  },
};