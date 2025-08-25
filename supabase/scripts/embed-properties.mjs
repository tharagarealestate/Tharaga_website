import 'dotenv/config';
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";


// Init Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Load embedding model
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function embedProperties() {
  // Fetch rows needing embedding
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, description")
    .eq("needs_embedding", true)
    .limit(10);

  if (error) throw error;
  if (!properties || properties.length === 0) {
    console.log("✅ No properties pending embedding");
    return;
  }

  console.log(`Embedding ${properties.length} properties...`);

  for (const p of properties) {
    try {
      const text = [p.title, p.description].filter(Boolean).join(" - ");
      const output = await embedder(text, { pooling: "mean", normalize: true });
      const embedding = Array.from(output.data);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          embedding,
          embedded_at: new Date().toISOString(),
          needs_embedding: false,
        })
        .eq("id", p.id);

      if (updateError) throw updateError;

      console.log(`✅ Embedded: ${p.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${p.id}`, err);
    }
  }
}

embedProperties().catch(console.error);
