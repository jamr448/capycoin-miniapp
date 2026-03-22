"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function Home() {
  const [status, setStatus] = useState("Cargando...");

  useEffect(() => {
    MiniKit.install();
    setStatus("Listo para reclamar");
  }, []);

  const handleVerify = async () => {
    try {
      setStatus("🔐 Verificando...");

      const res = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      console.log("Respuesta verify:", res);

      if (res.finalPayload?.status === "success") {
        setStatus("⏳ Procesando claim...");

        let nullifier = "";

        // ✅ Caso 1: payload normal
        if ("nullifier_hash" in res.finalPayload) {
          nullifier = res.finalPayload.nullifier_hash;
        }

        // ✅ Caso 2: payload con proofs (FIX TYPESCRIPT)
        else if ("proofs" in res.finalPayload) {
          const proofs = res.finalPayload.proofs as any[];

          if (proofs.length > 0) {
            nullifier = proofs[0].nullifier_hash;
          }
        }

        console.log("Nullifier:", nullifier);

        // 🚨 Validación
        if (!nullifier) {
          setStatus("❌ Error obteniendo identidad");
          return;
        }

        const response = await fetch("/api/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nullifier }),
        });

        const data = await response.json();

        console.log("Respuesta API:", data);

        if (data.success) {
          setStatus("💰 Claim exitoso!");
        } else {
          setStatus("⛔ " + data.message);
        }

      } else {
        setStatus("❌ Verificación fallida");
      }

    } catch (err) {
      console.error("ERROR:", err);
      setStatus("❌ Error en verificación");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617 0%, #0f172a 40%, #0369a1 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <h1>Capycoin</h1>

      <button
        onClick={handleVerify}
        style={{
          padding: "15px 25px",
          borderRadius: "25px",
          background: "#22c55e",
          color: "white",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Reclamar
      </button>

      <p style={{ marginTop: "20px", fontSize: "18px" }}>
        {status}
      </p>
    </main>
  );
}