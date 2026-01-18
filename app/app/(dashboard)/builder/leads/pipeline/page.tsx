"use client";

import dynamic from "next/dynamic";

const LeadPipelineKanban = dynamic(
  () =>
    import("./_components/LeadPipelineKanban").then(
      (mod) => mod.default
    ),
  { ssr: false }
);

export default function PipelinePage() {
  return <LeadPipelineKanban />;
}
