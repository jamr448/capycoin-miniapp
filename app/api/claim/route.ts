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

    const now = Date.now(); // 🔥 número, más preciso

if (existing) {
  const lastClaim = existing.last_claim
    ? new Date(existing.last_claim).getTime()
    : 0;

  const diff = Math.floor((now - lastClaim) / 1000);

  const COOLDOWN = 86400; // 24h

  if (diff < COOLDOWN) {
    const remaining = COOLDOWN - diff;

    return NextResponse.json({
      success: false,
      message: "Debes esperar",
      remaining,
    });
  }

  // ✅ actualizar correctamente
  const { error } = await supabase
    .from("claims")
    .update({ last_claim: new Date().toISOString() })
    .eq("nullifier", nullifier);

  if (error) {
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