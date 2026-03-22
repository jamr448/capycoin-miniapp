"use client";

import { useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {
  const [status, setStatus] = useState("");

  const handleVerify = async () => {
    try {
      setStatus("🔐 Verificando...");

      const res = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      console.log(res);

      if (res.finalPayload?.status === "success") {
        setStatus("✅ Verificado correctamente");
      } else {
        setStatus("❌ Verificación fallida");
      }

    } catch (err) {
      console.error(err);
      setStatus("❌ Error en verificación");
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #020617 0%, #0f172a 40%, #0369a1 100%)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif"
    }}>
      
      <img src="/logo.png" width={90} />

      <h1>Capycoin</h1>

      <button 
        onClick={handleVerify}
        style={{
          padding: "15px",
          borderRadius: "25px",
          background: "#22c55e",
          color: "white",
          border: "none",
          width: "200px",
          marginTop: "20px"
        }}
      >
        Reclamar
      </button>

      <p style={{ marginTop: "20px" }}>{status}</p>

    </main>
  );
}