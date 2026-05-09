"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getTimeWeight } from "@/lib/piv";
import { SEVERITY_FROM_TYPE } from "@/lib/incident-types";

async function requireAdmin() {
  const jar = await cookies();
  if (jar.get("admin_auth")?.value !== process.env.ADMIN_SECRET) {
    redirect("/admin/login");
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (password !== process.env.ADMIN_SECRET) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set("admin_auth", process.env.ADMIN_SECRET!, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete("admin_auth");
  redirect("/admin/login");
}

// ─── Create incident ─────────────────────────────────────────────────────────
export async function createIncidentAction(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const homeTeamId = formData.get("home_team_id") as string;
  const awayTeamId = formData.get("away_team_id") as string;
  const matchday   = parseInt(formData.get("matchday") as string);
  const kickoffAt  = formData.get("kickoff_at") as string;
  const seasonId   = "a1000000-0000-0000-0000-000000000003";

  // Upsert match (find existing or create)
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("home_team_id", homeTeamId)
    .eq("away_team_id", awayTeamId)
    .eq("season_id", seasonId)
    .single();

  let matchId = existingMatch?.id;
  if (!matchId) {
    const { data: newMatch } = await supabase
      .from("matches")
      .insert({
        season_id:    seasonId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        matchday,
        kickoff_at:   kickoffAt || null,
        status:       "finished",
      })
      .select("id")
      .single();
    matchId = newMatch?.id;
  }

  if (!matchId) redirect("/admin?error=match");

  const type        = formData.get("type") as string;
  const minute      = parseInt(formData.get("minute") as string);
  const gameState   = parseFloat(formData.get("game_state") as string) || 0;
  const videoUrl    = (formData.get("video_url") as string) || null;
  const refereeId   = (formData.get("referee_id") as string) || null;
  const description = (formData.get("description") as string) || null;

  // Voting closes at next matchday — use kickoff + 7 days as approximation
  const voteClosesAt = kickoffAt
    ? new Date(new Date(kickoffAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await supabase.from("incidents").insert({
    match_id:         matchId,
    referee_id:       refereeId || null,
    team_affected_id: formData.get("team_affected_id") as string,
    type,
    minute,
    severity:         SEVERITY_FROM_TYPE[type] ?? 0.5,
    time_weight:      getTimeWeight(minute),
    game_state:       gameState,
    video_url:        videoUrl,
    vote_closes_at:   voteClosesAt,
    description,
  });

  redirect("/admin");
}

// ─── Add panel verdict ───────────────────────────────────────────────────────
export async function addVerdictAction(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const incidentId = formData.get("incident_id") as string;

  // Max 3 verdicts per incident
  const { count } = await supabase
    .from("panel_verdicts")
    .select("*", { count: "exact", head: true })
    .eq("incident_id", incidentId);

  if ((count ?? 0) >= 3) redirect(`/admin/incidents/${incidentId}?error=max`);

  await supabase.from("panel_verdicts").insert({
    incident_id: incidentId,
    ref_name:    formData.get("ref_name") as string,
    verdict:     formData.get("verdict") as string,
  });

  redirect(`/admin/incidents/${incidentId}`);
}

// ─── Close incident (lock PIV) ───────────────────────────────────────────────
export async function closeIncidentAction(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();
  const incidentId = formData.get("incident_id") as string;

  const { data: inc } = await supabase
    .from("incidents")
    .select("piv_preview, referee_id, team_affected_id")
    .eq("id", incidentId)
    .single();

  if (!inc) redirect("/admin");

  // Lock PIV
  await supabase
    .from("incidents")
    .update({ piv_confirmed: inc.piv_preview, status: "confirmed", closed_at: new Date().toISOString() })
    .eq("id", incidentId);

  // Update referee accuracy — only if panel says incorrect
  if (inc.referee_id) {
    const { data: verdicts } = await supabase
      .from("panel_verdicts")
      .select("verdict")
      .eq("incident_id", incidentId);

    const panelCorrect = (verdicts ?? []).filter((v) => v.verdict === "correct").length;
    const panelTotal   = (verdicts ?? []).length;
    const isCorrect    = panelCorrect > panelTotal / 2; // majority says correct

    const seasonId = "a1000000-0000-0000-0000-000000000003";

    // Upsert accuracy row
    const { data: existing } = await supabase
      .from("referee_accuracy")
      .select("id, correct_calls, total_calls")
      .eq("referee_id", inc.referee_id)
      .eq("team_id", inc.team_affected_id)
      .eq("season_id", seasonId)
      .single();

    if (existing) {
      await supabase
        .from("referee_accuracy")
        .update({
          correct_calls: existing.correct_calls + (isCorrect ? 1 : 0),
          total_calls:   existing.total_calls + 1,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("referee_accuracy").insert({
        referee_id:    inc.referee_id,
        team_id:       inc.team_affected_id,
        season_id:     seasonId,
        correct_calls: isCorrect ? 1 : 0,
        total_calls:   1,
      });
    }
  }

  redirect(`/admin/incidents/${incidentId}`);
}

// ─── Toggle worst week / month ────────────────────────────────────────────────
export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();
  const incidentId = formData.get("incident_id") as string;
  const field      = formData.get("field") as "is_worst_week" | "is_worst_month";
  const value      = formData.get("value") === "true";

  // Clear existing flag for this period first
  await supabase.from("incidents").update({ [field]: false }).eq(field, true);
  // Set on this incident
  await supabase.from("incidents").update({ [field]: value }).eq("id", incidentId);

  redirect(`/admin/incidents/${incidentId}`);
}
