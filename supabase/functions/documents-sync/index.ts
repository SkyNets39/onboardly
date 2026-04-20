import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CallerProfile {
  role: string;
  company_id: string;
}

interface RequestBody {
  action?: string;
  document_id?: string;
}

interface DocumentRow {
  id: string;
  company_id: string;
  file_path: string;
  file_type: string;
  name: string;
  status: "processing" | "ready" | "failed";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const syncWebhookUrl = Deno.env.get("DOCUMENT_SYNC_WEBHOOK_URL");
  const syncWebhookSecret = Deno.env.get("DOCUMENT_SYNC_WEBHOOK_SECRET");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  if (body.action !== "sync") {
    return jsonResponse({ error: "Unknown action" }, 400);
  }

  const documentId = typeof body.document_id === "string" ? body.document_id : "";
  if (!documentId) {
    return jsonResponse({ error: "document_id required" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: callerRow, error: callerErr } = await adminClient
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  const caller = callerRow as CallerProfile | null;
  if (callerErr || !caller || caller.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const { data: documentRow, error: documentErr } = await adminClient
    .from("documents")
    .select("id, company_id, file_path, file_type, name, status")
    .eq("id", documentId)
    .single();

  const document = documentRow as DocumentRow | null;
  if (documentErr || !document) {
    return jsonResponse({ error: "Document not found" }, 404);
  }
  if (document.company_id !== caller.company_id) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }
  if (document.status === "ready") {
    return jsonResponse({ ok: true, status: "ready" }, 200);
  }

  const { error: updateErr } = await adminClient
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", document.id);

  if (updateErr) {
    return jsonResponse({ error: "Unable to queue document for syncing." }, 500);
  }

  // Fallback mode: queue-only sync when webhook is not configured.
  // This supports local/manual worker setups without hard failing the UI action.
  if (!syncWebhookUrl) {
    return jsonResponse({ ok: true, status: "processing", mode: "queued" }, 200);
  }
  let webhookResponse: Response;
  try {
    webhookResponse = await fetch(syncWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncWebhookSecret
          ? { Authorization: `Bearer ${syncWebhookSecret}` }
          : {}),
      },
      body: JSON.stringify({
        document_id: document.id,
        company_id: document.company_id,
        file_path: document.file_path,
        file_type: document.file_type,
        document_name: document.name,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook network error.";
    return jsonResponse({ error: `Sync webhook request failed: ${message}` }, 502);
  }

  if (!webhookResponse.ok) {
    const raw = await webhookResponse.text();
    return jsonResponse(
      {
        error: `Sync webhook failed (${webhookResponse.status}): ${raw || "unknown error"}`,
      },
      502,
    );
  }

  return jsonResponse({ ok: true, status: "processing", mode: "webhook" }, 200);
});
