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

    // 🔍 VERIFICAR SI YA EXISTE
    const { data: existing } = await supabase
      .from("claims")
      .select("*")
      .eq("nullifier", nullifier)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Ya reclamaste",
      });
    }

    // ✅ INSERTAR NUEVO CLAIM
    const { error } = await supabase.from("claims").insert([
      {
        nullifier,
      },
    ]);

    if (error) {
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