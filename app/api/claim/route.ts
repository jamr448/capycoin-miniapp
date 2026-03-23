import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { nullifier } = await req.json();

    if (!nullifier) {
      return NextResponse.json({
        success: false,
        message: "No nullifier",
      });
    }

    // 🔍 BUSCAR USUARIO
    const { data: existing } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .maybeSingle();

    const now = new Date();

    if (existing) {
      const lastClaim = new Date(existing.last_claim);
      const diff = (now.getTime() - lastClaim.getTime()) / 1000;

      // ⏱ 24 HORAS = 86400 segundos
      if (diff < 86400) {
        const remaining = Math.floor(86400 - diff);

        return NextResponse.json({
          success: false,
          message: "Debes esperar",
          remaining,
        });
      }

      // ✅ ACTUALIZAR TIEMPO
      await supabase
        .from("claims")
        .update({ last_claim: now })
        .eq("nullifier", nullifier);

      return NextResponse.json({
        success: true,
        message: "Claim exitoso",
      });
    }

    // 🆕 PRIMER CLAIM
    await supabase.from("claims").insert([
      {
        nullifier,
        last_claim: now,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Claim exitoso",
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: "Error servidor",
    });
  }
}