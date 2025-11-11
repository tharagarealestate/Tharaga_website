import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: {
      pipeline_id?: string;
      new_stage?: PipelineStage;
      notes?: string;
    };

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const pipelineId = payload.pipeline_id?.trim();
    const newStage = payload.new_stage;
    const notes = payload.notes?.trim();

    if (!pipelineId || !newStage) {
      return NextResponse.json(
        { error: "pipeline_id and new_stage are required" },
        { status: 400 }
      );
    }

    if (!(newStage in STAGE_ORDER)) {
      return NextResponse.json(
        { error: "Invalid pipeline stage" },
        { status: 400 }
      );
    }

    const { data: pipeline, error: pipelineError } = await supabase
      .from("lead_pipeline")
      .select("id, builder_id")
      .eq("id", pipelineId)
      .maybeSingle();

    if (pipelineError) {
      return NextResponse.json(
        { error: pipelineError.message },
        { status: 500 }
      );
    }

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline record not found" },
        { status: 404 }
      );
    }

    if (pipeline.builder_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatePayload: Record<string, any> = {
      stage: newStage,
      stage_order: STAGE_ORDER[newStage],
    };
    if (typeof notes === "string" && notes.length > 0) {
      updatePayload.notes = notes;
    }

    const { error: updateError } = await supabase
      .from("lead_pipeline")
      .update(updatePayload)
      .eq("id", pipelineId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[lead_pipeline:update-stage] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

