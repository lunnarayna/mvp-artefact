import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, designId, userId } = await request.json();

    if (!imageUrl || !designId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Confirm design belongs to user
    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("embedding")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (designError || !design?.embedding) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    // Search Google Images via SerpApi
    console.log("[search-web] searching for similar images...");
    const results = await getJson({
      engine: "google_reverse_image",
      image_url: imageUrl,
      api_key: process.env.SERPAPI_KEY!,
    });

    // Extract image results
    const imageResults: { title: string; url: string; thumbnailUrl: string; source: string }[] = [];

    const items = results?.image_results ?? results?.inline_images ?? [];
    for (const item of items.slice(0, 30)) {
      const url = item.original ?? item.link ?? item.url;
      const thumbnail = item.thumbnail ?? item.image ?? url;
      if (url) {
        imageResults.push({
          title: item.title ?? "Untitled",
          url,
          thumbnailUrl: thumbnail,
          source: item.source ?? item.displayed_link ?? "",
        });
      }
    }

    console.log("[search-web] found", imageResults.length, "images");

    if (imageResults.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Generate embeddings for found images and compare
    const { pipeline, RawImage } = await import("@xenova/transformers");
    const ext = await pipeline(
      "image-feature-extraction",
      "Xenova/clip-vit-base-patch32",
      { revision: "main" }
    );

    const queryEmbedding: number[] = design.embedding;
    const matches: {
      title: string;
      url: string;
      thumbnailUrl: string;
      source: string;
      similarity: number;
      level: string;
    }[] = [];

    for (const img of imageResults) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const image = await (RawImage as any).fromURL(img.thumbnailUrl);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = await ext(image, { pooling: "mean", normalize: true } as Record<string, unknown>) as any;
        const imgEmbedding: number[] = Array.from(output.data as Float32Array);

        // Cosine similarity
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < queryEmbedding.length; i++) {
          dot += queryEmbedding[i] * imgEmbedding[i];
          normA += queryEmbedding[i] ** 2;
          normB += imgEmbedding[i] ** 2;
        }
        const similarity = Math.round((dot / (Math.sqrt(normA) * Math.sqrt(normB))) * 100);

        if (similarity >= 30) {
          const level =
            similarity >= 85 ? "VERY SIMILAR" :
            similarity >= 70 ? "MODERATELY SIMILAR" :
            "DISTANTLY SIMILAR";

          matches.push({ ...img, similarity, level });
        }
      } catch {
        // Skip images that fail to load
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    console.log("[search-web] matches after threshold:", matches.length);
    return NextResponse.json({ matches });
  } catch (err) {
    console.error("[search-web] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}