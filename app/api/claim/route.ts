import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { nullifier } = await req.json();

  const now = new Date();

  // 🔍 Buscar usuario
  const { data: existing } = await supabase
    .from("claims")
    .select("*")
    .eq("nullifier", nullifier)
    .single();

  if (existing) {
    const last = new Date(existing.last_claim);
    const diff = now.getTime() - last.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return NextResponse.json({
        success: false,
        message: `Vuelve en ${Math.ceil(24 - hours)} horas`
      });
    }

    // 🔄 actualizar
    await supabase
      .from("claims")
      .update({ last_claim: now })
      .eq("nullifier", nullifier);

  } else {
    // 🆕 nuevo usuario
    await supabase.from("claims").insert({
      nullifier,
      last_claim: now
    });
  }

  return NextResponse.json({ success: true });
}