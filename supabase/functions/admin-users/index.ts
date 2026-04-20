import { createClient } from "jsr:@supabase/supabase-js@2";

const DEFAULT_PASSWORD = "init123";

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
  email?: string;
  full_name?: string;
  position?: string | null;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: callerRow, error: callerErr } = await adminClient
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  const caller = callerRow as CallerProfile | null;
  if (callerErr || !caller || caller.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const companyId = caller.company_id;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const action = body.action;

  if (action === "create") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const full_name =
      typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "email and full_name required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const posRaw =
      body.position != null && typeof body.position === "string"
        ? body.position.trim()
        : "";
    const positionMeta = posRaw.length > 0 ? posRaw : undefined;

    const user_metadata: Record<string, string> = {
      company_id: companyId,
      full_name,
      role: "employee",
    };
    if (positionMeta !== undefined) {
      user_metadata.position = positionMeta;
    }

    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata,
      });

    if (createErr) {
      const msg = createErr.message ?? "Create failed";
      const lower = msg.toLowerCase();
      const status =
        lower.includes("already") || lower.includes("duplicate")
          ? 409
          : 400;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: created.user?.id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "delete") {
    const user_id = typeof body.user_id === "string" ? body.user_id : "";
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: targetRow, error: targetErr } = await adminClient
      .from("users")
      .select("company_id")
      .eq("id", user_id)
      .single();

    const target = targetRow as { company_id: string } | null;
    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (target.company_id !== companyId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
