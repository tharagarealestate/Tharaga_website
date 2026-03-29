import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

Deno.serve(async (req) => {
  const secret = req.headers.get("x-secret");
  if (secret !== "exec-sql-016") return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const sqlText: string = body.sql;
  if (!sqlText) return Response.json({ error: "No sql provided" }, { status: 400 });

  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const sql = postgres(dbUrl, { ssl: "require" });

  try {
    await sql.unsafe(sqlText);
    await sql.end();
    return Response.json({ ok: true });
  } catch (e: any) {
    await sql.end();
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
});
