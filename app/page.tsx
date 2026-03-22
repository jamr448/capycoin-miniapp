"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {
  const [status, setStatus] = useState("Cargando...");

  useEffect(() => {
    // 🔥 INICIALIZAR MINIKIT
    MiniKit.install();
    setStatus("Listo para verificar");
  }, []);

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
      background: "#020617",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      
      <h1>Capycoin</h1>

      <button onClick={handleVerify}>
        Reclamar
      </button>

      <p>{status}</p>

    </main>
  );
}