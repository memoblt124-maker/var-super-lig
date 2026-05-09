// @ts-nocheck
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

async function getVoterId(): Promise<string> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  // Hash for privacy — we never store raw IPs
  return createHash("sha256").update(ip).digest("hex");
}

export async function castVoteAction(formData: FormData) {
  const incidentId = formData.get("incident_id") as string;
  const vote       = formData.get("vote") as string;

  const voterId  = await getVoterId();
  const supabase = createServiceClient();

  // Check if already voted — no changes allowed
  const { data: existing } = await supabase
    .from("fan_votes")
    .select("id")
    .eq("incident_id", incidentId)
    .eq("user_id", voterId)
    .single();

  if (!existing) {
    await supabase.from("fan_votes").insert({
      incident_id: incidentId,
      user_id:     voterId,
      vote,
    });
  }

  redirect(`/incidents/${incidentId}`);
}
