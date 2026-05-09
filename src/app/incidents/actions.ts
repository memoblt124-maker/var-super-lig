// @ts-nocheck
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const VOTER_COOKIE = "var_voter_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

async function getOrCreateVoterId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VOTER_COOKIE)?.value;
  if (existing) return existing;
  const newId = randomUUID();
  jar.set(VOTER_COOKIE, newId, { maxAge: ONE_YEAR, httpOnly: true, sameSite: "lax" });
  return newId;
}

export async function castVoteAction(formData: FormData) {
  const incidentId = formData.get("incident_id") as string;
  const vote       = formData.get("vote") as string;

  const voterId = await getOrCreateVoterId();
  const supabase = createServiceClient();

  await supabase.from("fan_votes").upsert(
    { incident_id: incidentId, user_id: voterId, vote },
    { onConflict: "incident_id,user_id" }
  );

  redirect(`/incidents/${incidentId}`);
}
