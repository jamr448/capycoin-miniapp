"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");

  async function verify() {
    if (!MiniKit.isInstalled()) {
      setStatus("⚠️ Abre esto dentro de World App");
      return;
    }

    try {
      setStatus("🔐 Verificando...");

      const result = await MiniKit.commandsAsync.verify({
        action: "claimcapycoin",
      });

      console.log(result);

      setStatus("✅ Verificación exitosa 🚀");

    } catch (err) {
      console.error(err);
      setStatus("❌ Error en verificación");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-6">🪙 CAPYCOIN</h1>

      <button
        onClick={verify}
        className="bg-green-500 px-6 py-3 rounded-xl text-lg"
      >
        Reclamar
      </button>

      <p className="mt-4 text-center">{status}</p>

    </main>
  );
}