import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("designs")
      .select("id, file_name, permanent_url, storage_path, created_at, saved")
      .eq("user_id", userId)
      .eq("saved", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ designs: data ?? [] });
  } catch (err) {
    console.error("[garden] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { designId, userId } = await request.json();
    if (!designId || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: design } = await supabase
      .from("designs")
      .select("storage_path")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (design?.storage_path) {
      await supabase.storage.from("designs").remove([design.storage_path]);
    }

    await supabase.from("designs").delete().eq("id", designId).eq("user_id", userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[garden] delete error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}