import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOLDOWN = 86400; // 24h

export async function POST(req: Request) {
  try {

    const { nullifier } = await req.json();

    if (!nullifier) {
      return NextResponse.json({
        success: false,
        message: "No nullifier"
      });
    }

    const now = new Date();

    // buscar usuario
    const { data: existing } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .maybeSingle();

    // usuario ya existe
    if (existing) {

      const lastClaim = existing.last_claim
        ? new Date(existing.last_claim).getTime()
        : 0;

      const diff = Math.floor(
        (Date.now() - lastClaim) / 1000
      );

      // cooldown activo
      if (diff < COOLDOWN) {

        return NextResponse.json({
          success: false,
          message: "Debes esperar",
          remaining: COOLDOWN - diff,
          balance: existing.balance ?? 0
        });

      }

      const newBalance = (existing.balance ?? 0) + 5;

      // 🔒 UPDATE SEGURO (evita multi reclamo)
      const { data: updated, error: updateError } = await supabase
        .from("claims")
        .update({
          last_claim: now,
          balance: newBalance
        })
        .eq("nullifier", nullifier)
        .eq("last_claim", existing.last_claim) // clave anti doble reclamo
        .select()
        .maybeSingle();

      if (updateError || !updated) {

        return NextResponse.json({
          success: false,
          message: "Reclamo ya procesado",
          balance: existing.balance ?? 0
        });

      }

      return NextResponse.json({
        success: true,
        message: "Claim exitoso",
        balance: newBalance,
        remaining: COOLDOWN
      });

    }

    // 🆕 primer claim
    const { error: insertError } = await supabase
      .from("claims")
      .insert([
        {
          nullifier,
          last_claim: now,
          balance: 5
        }
      ]);

    if (insertError) {

      console.error(insertError);

      return NextResponse.json({
        success: false,
        message: "Error al guardar"
      });

    }

    return NextResponse.json({
      success: true,
      message: "Claim exitoso",
      balance: 5,
      remaining: COOLDOWN
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json({
      success: false,
      message: "Error servidor"
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

    if (!data) {

      return NextResponse.json({
        success: true,
        remaining: 0,
        balance: 0
      });

    }

    const lastClaim = new Date(data.last_claim).getTime();

    const diff = Math.floor(
      (Date.now() - lastClaim) / 1000
    );

    const remaining =
      diff >= COOLDOWN
        ? 0
        : COOLDOWN - diff;

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