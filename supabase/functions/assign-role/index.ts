import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      throw new Error("userId and role are required");
    }

    const validRoles = ["admin", "owner", "driver", "client_individual", "client_corporate"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    console.log(`Assigning role ${role} to user ${userId}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify user exists in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw new Error(`Failed to find profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error("User profile not found");
    }

    console.log(`Found profile for user: ${profile.email}`);

    // Upsert the role (insert or update if exists)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: role },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Role assignment error:", roleError);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // If assigning owner role, also update is_fleet_owner
    if (role === "owner") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ is_fleet_owner: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        // Don't throw, role was assigned successfully
      }
    }

    console.log(`Successfully assigned ${role} role to user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: `Role ${role} assigned successfully` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
