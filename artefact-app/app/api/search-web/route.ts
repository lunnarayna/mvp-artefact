import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("id")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (designError || !design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    console.log("[search-web] fetching image for Gemini analysis:", imageUrl);

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString("base64");
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

    // No search grounding (free tier compatible) — just describe the image
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Look at this design image carefully. Describe its visual style in 3-6 short search-friendly keyword phrases that someone could use to find visually similar designs online (e.g. on Pinterest, Dribbble, or Google Images).

Focus on: color palette, composition style, design movement/aesthetic (e.g. "neo-brutalism", "glassmorphism", "minimalist"), subject matter, and mood.

Respond ONLY with a JSON array of strings, nothing else. Example:
["neo-brutalist dashboard UI", "pink and black color scheme", "bold geometric layout"]`;

    console.log("[search-web] calling Gemini for keyword extraction...");

    const result = await model.generateContent([
      { inlineData: { mimeType: contentType, data: imgBase64 } },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    console.log("[search-web] raw Gemini response:", responseText);

    const cleaned = responseText.replace(/```json|```/g, "").trim();

    let keywords: string[] = [];
    try {
      keywords = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[search-web] failed to parse keywords:", parseErr);
      keywords = [];
    }

    // Build clickable search links instead of automatic comparison
    const searchLinks = keywords.map((kw) => ({
      title: kw,
      url: `https://www.google.com/search?q=${encodeURIComponent(kw)}&tbm=isch`,
      pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(kw)}`,
    }));

    console.log("[search-web] generated search links:", searchLinks.length);
    return NextResponse.json({ keywords, searchLinks });
  } catch (err) {
    console.error("[search-web] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}