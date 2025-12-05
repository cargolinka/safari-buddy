import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewDriverNotification {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  country: string;
  licenseNumber: string;
  isVehicleOwner: boolean;
  entityType: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NewDriverNotification = await req.json();
    console.log("New driver registration notification:", data);

    // Get admin emails from database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found to notify");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminIds = adminRoles.map(r => r.user_id);
    
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", adminIds)
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw profilesError;
    }

    const adminEmails = adminProfiles?.filter(p => p.email).map(p => p.email) || [];
    
    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: true, message: "No admin emails found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending notification to ${adminEmails.length} admin(s):`, adminEmails);

    const ownerInfo = data.isVehicleOwner 
      ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
            <strong style="color: #555;">Owner Type:</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
            ${data.entityType === 'company' ? `Company - ${data.companyName || 'N/A'}` : 'Individual Owner'}
          </td>
        </tr>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">
                  🚨 New Driver Registration
                </h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
                  A new driver has registered and requires your review:
                </p>
                
                <table width="100%" style="border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">Name:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      ${data.driverName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">Email:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      <a href="mailto:${data.driverEmail}" style="color: #2d5a87;">${data.driverEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">Phone:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      ${data.driverPhone}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">Country:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      ${data.country}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">License #:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      ${data.licenseNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                      <strong style="color: #555;">Vehicle Owner:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">
                      ${data.isVehicleOwner ? '✅ Yes' : '❌ No'}
                    </td>
                  </tr>
                  ${ownerInfo}
                </table>
                
                <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⚠️ Action Required:</strong> Please review the driver's documents and approve or reject their registration.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://safarihirehub.com/admin/drivers" 
                     style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                    Review in Admin Dashboard
                  </a>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px; margin: 0;">
                  Safari Hire Hub Admin Notification
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Safari Hire Hub <onboarding@resend.dev>",
        to: adminEmails,
        subject: `🚨 New Driver Registration: ${data.driverName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const responseData = await res.json();
    console.log("Admin notification sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
