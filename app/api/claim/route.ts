import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COOLDOWN = 60; // prueba
const REWARD = 5;

export async function POST(req: Request) {

  try {

    const { nullifier } = await req.json();

    if (!nullifier) {
      return NextResponse.json({
        success: false,
        message: "Missing nullifier"
      });
    }

    const now = Date.now();

    const { data: user, error } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json({
        success: false,
        message: "Database error"
      });
    }

    // 🆕 usuario nuevo
    if (!user) {

      const nowISO = new Date().toISOString();

      const { error: insertError } = await supabase
        .from("claims")
        .insert([{
          nullifier,
          last_claim: nowISO,
          balance: REWARD
        }]);

      if (insertError) {
        console.error(insertError);
        return NextResponse.json({
          success: false,
          message: "Insert error"
        });
      }

      return NextResponse.json({
        success: true,
        balance: REWARD,
        remaining: COOLDOWN
      });
    }

    // ⏱️ cooldown
    const lastClaim = new Date(user.last_claim).getTime();
    const diff = Math.floor((now - lastClaim) / 1000);

    if (diff < COOLDOWN) {
      return NextResponse.json({
        success: false,
        message: "Cooldown active",
        remaining: COOLDOWN - diff,
        balance: user.balance ?? 0
      });
    }

    const nowISO = new Date().toISOString();

    // ✅ UPDATE ÚNICO Y LIMPIO
    const { data: updated, error: updateError } = await supabase
      .from("claims")
      .update({
        last_claim: nowISO,
        balance: (user.balance ?? 0) + REWARD
      })
      .eq("nullifier", nullifier)
      .select()
      .maybeSingle();

    if (updateError || !updated) {
      console.error(updateError);
      return NextResponse.json({
        success: false,
        message: "Update failed"
      });
    }

    return NextResponse.json({
      success: true,
      balance: updated.balance,
      remaining: COOLDOWN
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json({
      success: false,
      message: "Server error"
    });

  }
}


// ✅ GET separado correctamente
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

    const now = Date.now();
    const lastClaim = new Date(data.last_claim).getTime();

    const diff = Math.floor((now - lastClaim) / 1000);

    const remaining =
      diff >= COOLDOWN
        ? 0
        : COOLDOWN - diff;

    return NextResponse.json({
      success: true,
      remaining,
      balance: data.balance ?? 0
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json({
      success: false
    });

  }
}