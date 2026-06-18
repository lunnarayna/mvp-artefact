import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { designId, userId } = await request.json();

    if (!designId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("embedding")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (designError || !design?.embedding) {
      return NextResponse.json({ error: "Design or embedding not found" }, { status: 404 });
    }

    const { data: matches, error: matchError } = await supabase.rpc("match_designs", {
      query_embedding: design.embedding,
      match_threshold: 0.3,
      match_count: 20,
      requesting_user_id: userId,
    });

    if (matchError) throw matchError;

    // Only match against designs the user explicitly saved to their garden,
    // and exclude the design being analysed right now.
    const candidateIds = (matches ?? [])
      .filter((m: { user_id: string; id: string }) => m.user_id === userId && m.id !== designId)
      .map((m: { id: string }) => m.id);

    let savedSet = new Set<string>();
    if (candidateIds.length > 0) {
      const { data: savedRows } = await supabase
        .from("designs")
        .select("id")
        .in("id", candidateIds)
        .eq("saved", true);
      savedSet = new Set((savedRows ?? []).map((r: { id: string }) => r.id));
    }

    const ownDesigns = (matches ?? []).filter(
      (m: { user_id: string; id: string }) =>
        m.user_id === userId && m.id !== designId && savedSet.has(m.id)
    );

    const ownGarden = await Promise.all(
      ownDesigns.map(async (m: {
        id: string;
        user_id: string;
        file_name: string;
        storage_path: string;
        similarity: number;
        created_at: string;
      }) => {
        const { data: urlData } = await supabase.storage
          .from("designs")
          .createSignedUrl(m.storage_path, 60 * 60);

        const similarity = Math.round(m.similarity * 100);
        const level =
          similarity >= 85 ? "VERY SIMILAR" :
          similarity >= 70 ? "MODERATELY SIMILAR" :
          "DISTANTLY SIMILAR";

        return {
          id: m.id,
          fileName: m.file_name,
          signedUrl: urlData?.signedUrl ?? null,
          similarity,
          level,
          createdAt: m.created_at,
        };
      })
    );

    return NextResponse.json({ ownGarden });
  } catch (err) {
    console.error("[match] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}