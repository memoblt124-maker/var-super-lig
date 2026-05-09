"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function signInWithGoogleAction(formData: FormData) {
  const incidentId = formData.get("incident_id") as string;
  const supabase = await getAuthClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/callback?next=/incidents/${incidentId}`,
    },
  });

  if (error || !data.url) redirect(`/incidents/${incidentId}`);
  redirect(data.url);
}

export async function signOutAction(formData: FormData) {
  const incidentId = formData.get("incident_id") as string;
  const supabase = await getAuthClient();
  await supabase.auth.signOut();
  redirect(`/incidents/${incidentId}`);
}

export async function castVoteAction(formData: FormData) {
  const incidentId = formData.get("incident_id") as string;
  const vote = formData.get("vote") as string;

  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/incidents/${incidentId}`);

  // Upsert — if they already voted, update it
  await supabase.from("fan_votes").upsert(
    { incident_id: incidentId, user_id: user.id, vote },
    { onConflict: "incident_id,user_id" }
  );

  redirect(`/incidents/${incidentId}`);
}
