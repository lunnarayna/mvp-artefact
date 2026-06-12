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

    // Fetch the embedding of the uploaded design
    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("embedding")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (designError || !design?.embedding) {
      return NextResponse.json({ error: "Design or embedding not found" }, { status: 404 });
    }

    // Run similarity search
    const { data: matches, error: matchError } = await supabase.rpc("match_designs", {
      query_embedding: design.embedding,
      match_threshold: 0.3,
      match_count: 20,
      requesting_user_id: userId,
    });

    if (matchError) throw matchError;

    // Separate into own garden vs others' garden
    // Generate signed URLs for each match
    const withUrls = await Promise.all(
      (matches ?? []).map(async (m: {
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
          similarity >= 85
            ? "VERY SIMILAR"
            : similarity >= 70
            ? "MODERATELY SIMILAR"
            : "DISTANTLY SIMILAR";

        return {
          id: m.id,
          userId: m.user_id,
          fileName: m.file_name,
          signedUrl: urlData?.signedUrl ?? null,
          similarity,
          level,
          isOwn: m.user_id === userId,
          createdAt: m.created_at,
        };
      })
    );

    const ownGarden = withUrls.filter((m) => m.isOwn);
    const othersGarden = withUrls.filter((m) => !m.isOwn);

    return NextResponse.json({ ownGarden, othersGarden });
  } catch (err) {
    console.error("[match] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}