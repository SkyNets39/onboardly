import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Embed query pakai Gemini
async function embedQuery(query: string): Promise<number[]> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: query }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768
      })
    }
  );
  const data = await res.json();
  return data.embedding.values;
}

// Ambil context dari pgvector
async function retrieveContext(
  supabase: ReturnType<typeof createClient>,
  embedding: number[],
  companyId: string
) {
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_company_id: companyId,
    match_count: 5,
    match_threshold: 0.5
  });

  if (error) throw error;
  return data ?? [];
}

// Generate jawaban pakai Claude
async function generateAnswer(query: string, chunks: any[]): Promise<string> {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join("\n\n");

  const prompt = `Kamu adalah asisten onboarding perusahaan yang membantu karyawan baru.
Jawab pertanyaan berdasarkan konteks dokumen perusahaan di bawah ini.
Jika jawaban tidak ada dalam konteks, katakan "Informasi ini tidak tersedia dalam dokumen yang ada."
Selalu sebutkan nomor sumber [1], [2], dst di akhir kalimat yang relevan.

KONTEKS:
${context}

PERTANYAAN: ${query}

JAWABAN:`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 }
    })
  });

  const data = await res.json();
  
  // Temporary debug — hapus setelah fix
  if (!data.candidates) {
    throw new Error(`Gemini error: ${JSON.stringify(data)}`);
  }

  return data.candidates[0].content.parts[0].text;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      }
    });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Init Supabase client dengan user JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { query, session_id, company_id } = await req.json();
    if (!query || !company_id) {
      return new Response(JSON.stringify({ error: "query and company_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // RAG Pipeline
    const embedding = await embedQuery(query);
    const chunks = await retrieveContext(supabase, embedding, company_id);
    const answer = await generateAnswer(query, chunks);

    // Format sources untuk citation
    const sources = chunks.map((c) => ({
      document_id: c.document_id,
      content_preview: c.content.slice(0, 100),
      similarity: c.similarity
    }));

    // Simpan pesan ke DB kalau ada session_id
    if (session_id) {
      await supabase.from("chat_messages").insert([
        {
          session_id,
          company_id,
          role: "user",
          content: query,
          sources: []
        },
        {
          session_id,
          company_id,
          role: "assistant",
          content: answer,
          sources
        }
      ]);
    }

    return new Response(
      JSON.stringify({ answer, sources }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});