"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {

  const [status, setStatus] = useState("Verifica tu identidad");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState("claim");

  // instalar MiniKit
  useEffect(() => {
    MiniKit.install();

    const checkCooldown = async () => {

      const nullifier = localStorage.getItem("capyNullifier");

      if (!nullifier) return;

      const res = await fetch(`/api/claim?nullifier=${nullifier}`);
      const data = await res.json();

      if (data.remaining && data.remaining > 0) {
        setRemaining(data.remaining);
      }

      if (data.balance !== undefined) {
        setBalance(data.balance);
      }

      setVerified(true);
    };

    checkCooldown();

  }, []);

  // contador en vivo
  useEffect(() => {

    if (remaining === null) return;

    const interval = setInterval(() => {

      setRemaining((prev) => {

        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setStatus("🎉 Ya puedes reclamar!");
          return null;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(interval);

  }, [remaining]);

  const formatTime = (t: number) => {

    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  };

  // verificar identidad
  const handleVerify = async () => {

    try {

      setStatus("🔐 Verificando...");

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

      localStorage.setItem("capyNullifier", nullifier);

      if (
        res.finalPayload?.status === "success" ||
        (res.finalPayload as any)?.status === "verified"
      ) {

        setVerified(true);
        setStatus("✅ Verificado");

      } else {

        setStatus("❌ Falló verificación");

      }

    } catch (err) {

      console.error(err);
      setStatus("❌ Error verificando identidad");

    }

  };

  // reclamar
  const handleClaim = async () => {

    try {

      setStatus("⏳ Procesando...");

      const nullifier = localStorage.getItem("capyNullifier");

      if (!nullifier) {
        setStatus("❌ Usuario no verificado");
        return;
      }

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nullifier }),
      });

      const data = await response.json();

      if (data.success) {

        setStatus("💰 Claim exitoso!");
        setBalance((prev) => prev + 100);

      } else {

        if (data.remaining) {

          setStatus("⛔ Debes esperar");
          setRemaining(data.remaining);

        } else {

          setStatus("⛔ " + data.message);

        }

      }

    } catch (err) {

      console.error(err);
      setStatus("❌ Error en claim");

    }

  };

  // pantalla verificación
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

  // app principal
  return (

    <main style={styles.container}>

      <div style={styles.tabs}>

        <button onClick={() => setTab("claim")} style={styles.tab}>
          Reclamar
        </button>

        <button onClick={() => setTab("about")} style={styles.tab}>
          Acerca de
        </button>

      </div>

      {tab === "claim" && (

        <>

          <h2>💰 Tu balance</h2>

          <p style={{fontSize: "24px", fontWeight: "bold"}}>
            {balance} CAPY
          </p>

          <h2 style={{marginTop: "20px"}}>

            {remaining !== null
              ? `⏱️ ${formatTime(remaining)}`
              : "🟢 Disponible para reclamar"}

          </h2>

          <button
            style={{
              ...styles.claimButton,
              opacity: remaining ? 0.5 : 1
            }}
            onClick={handleClaim}
            disabled={remaining !== null}
          >

            {remaining !== null ? "Espera..." : "Reclamar"}

          </button>

          <p style={{marginTop: "30px"}}>
            🔥 11,150 usuarios reclamando
          </p>

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

const styles: any = {

  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  button: {
    padding: "15px 25px",
    borderRadius: "20px",
    background: "#22c55e",
    border: "none",
    color: "white",
    marginTop: "20px"
  },

  claimButton: {
    padding: "20px",
    borderRadius: "30px",
    background: "#0ea5e9",
    border: "none",
    color: "white",
    marginTop: "40px",
    width: "200px"
  },

  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },

  tab: {
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#1e293b",
    color: "white",
    border: "none"
  }

};