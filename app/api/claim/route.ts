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

    // 🔍 Buscar usuario
    const { data: existing } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .maybeSingle();

    const now = Date.now();
    const COOLDOWN = 86400;

    if (existing) {
      const lastClaim = existing.last_claim
        ? new Date(existing.last_claim).getTime()
        : 0;

      const diff = Math.floor((now - lastClaim) / 1000);

      if (diff < COOLDOWN) {
        return NextResponse.json({
          success: false,
          message: "Debes esperar",
          remaining: COOLDOWN - diff,
        });
      }

      // ✅ actualizar tiempo correctamente
      const { error: updateError } = await supabase
  .from("claims")
  .update({
    last_claim: now,
    balance: (existing.balance || 0) + 5
  })
  .eq("nullifier", nullifier);

      if (updateError) {
        return NextResponse.json({
          success: false,
          message: "Error al actualizar",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Claim exitoso",
      });
    }

    // 🆕 Primer claim
    const { error: insertError } = await supabase.from("claims").insert([
      {
        nullifier,
        last_claim: new Date(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({
        success: false,
        message: "Error al guardar",
      });
    }

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nullifier = searchParams.get("nullifier");

    if (!nullifier) {
      return NextResponse.json({ success: false });
    }

    const { data } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .maybeSingle();

    // usuario nuevo
    if (!data) {
      return NextResponse.json({
        success: true,
        remaining: 0,
        balance: 0
      });
    }

    const now = Date.now();
    const lastClaim = new Date(data.last_claim).getTime();

    const diff = Math.floor((now - lastClaim) / 1000);
    const COOLDOWN = 86400;

    const remaining =
      diff >= COOLDOWN ? 0 : COOLDOWN - diff;

    return NextResponse.json({
      success: true,
      remaining,
      balance: data.balance ?? 0
    });

  } catch {
    return NextResponse.json({
      success: false
    });
  }
}