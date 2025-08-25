exports.handler = async function(event) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
      SHEET_CSV_URL: process.env.SHEET_CSV_URL || null,
      METRO_JSON_URL: process.env.METRO_JSON_URL || "./metro.json"
    })
  };
};
