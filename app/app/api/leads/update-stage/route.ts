import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAGE_ORDER: Record<string, number> = {
  new: 1,
  contacted: 2,
  qualified: 3,
  site_visit_scheduled: 4,
  site_visit_completed: 5,
  negotiation: 6,
  offer_made: 7,
  closed_won: 8,
  closed_lost: 9,
};

type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit_scheduled"
  | "site_visit_completed"
  | "negotiation"
  | "offer_made"
  | "closed_won"
  | "closed_lost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    pipeline_id?: string;
    new_stage?: PipelineStage;
    notes?: string;
    deal_value?: number;
    probability?: number;
    expected_close_date?: string;
    loss_reason?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    pipeline_id,
    new_stage,
    notes,
    deal_value,
    probability,
    expected_close_date,
    loss_reason,
  } = payload;

  if (!pipeline_id || !new_stage) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!(new_stage in STAGE_ORDER)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const updateData: Record<string, any> = {
    stage: new_stage,
    stage_order: STAGE_ORDER[new_stage],
    updated_at: new Date().toISOString(),
  };

  if (typeof notes === "string" && notes.trim().length > 0) {
    updateData.notes = notes.trim();
  }
  if (deal_value !== undefined) {
    updateData.deal_value = deal_value;
  }
  if (probability !== undefined) {
    updateData.probability = probability;
  }
  if (expected_close_date) {
    updateData.expected_close_date = expected_close_date;
  }
  if (typeof loss_reason === "string" && loss_reason.trim().length > 0) {
    updateData.loss_reason = loss_reason.trim();
  }

  const { data, error } = await supabase
    .from("lead_pipeline")
    .update(updateData)
    .eq("id", pipeline_id)
    .eq("builder_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[lead_pipeline:update-stage] update error", error);
    return NextResponse.json(
      { error: "Failed to update stage" },
      { status: 500 }
    );
  }

  if (
    ["qualified", "site_visit_scheduled", "offer_made", "closed_won"].includes(
      new_stage
    )
  ) {
    const notificationPayload = {
      user_id: user.id,
      type: "lead_interaction",
      priority: new_stage === "closed_won" ? "high" : "medium",
      title: `Lead moved to ${new_stage.replace(/_/g, " ")}`,
      message: "Pipeline stage updated successfully",
      lead_id: data.lead_id,
      metadata: {
        new_stage,
        deal_value,
      },
      action_url: `/builder/dashboard/leads/${data.lead_id}`,
      action_label: "View Lead",
    };

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notificationPayload);

    if (notificationError) {
      console.error(
        "[lead_pipeline:update-stage] notification error",
        notificationError
      );
    }
  }

  return NextResponse.json({ success: true, data });
}

