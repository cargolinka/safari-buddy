import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyTokenRequest = await req.json();
    
    console.log("Verifying email token");

    if (!token) {
      throw new Error("Token is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token not found:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification link" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if already verified
    if (tokenData.verified_at) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email already verified",
          email: tokenData.email 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification link has expired. Please request a new one." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark token as verified
    const { error: updateTokenError } = await supabase
      .from("email_verification_tokens")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (updateTokenError) {
      console.error("Error updating token:", updateTokenError);
      throw new Error("Failed to verify email");
    }

    // Update user's email_confirmed_at in auth.users using admin API
    const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (userUpdateError) {
      console.error("Error confirming user email:", userUpdateError);
      // Don't throw - the token is still marked as verified
    }

    console.log("Email verified successfully for:", tokenData.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully",
        email: tokenData.email 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
