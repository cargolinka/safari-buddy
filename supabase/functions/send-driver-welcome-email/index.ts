import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DriverWelcomeEmailRequest {
  email: string;
  fullName: string;
  isVehicleOwner?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, isVehicleOwner }: DriverWelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to driver: ${email} (${fullName})`);

    const ownerSection = isVehicleOwner 
      ? `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2d5016; margin: 0 0 10px 0;">🚗 Fleet Owner Benefits</h3>
          <p style="margin: 0; color: #555;">As a registered vehicle owner, you can:</p>
          <ul style="color: #555; padding-left: 20px;">
            <li>Add and manage your fleet vehicles</li>
            <li>Track earnings and bookings</li>
            <li>Invite drivers to your fleet</li>
          </ul>
        </div>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Safari Hire Hub</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                  🦁 Safari Hire Hub
                </h1>
                <p style="color: #d4e5c7; margin: 10px 0 0 0; font-size: 14px;">
                  Premium Safari Vehicle Rentals
                </p>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #2d5016; margin: 0 0 20px 0; font-size: 24px;">
                  Welcome, ${fullName}! 🎉
                </h2>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for registering as a driver with Safari Hire Hub. Your account has been created successfully and is now under review by our team.
                </p>
                
                <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⏳ What's Next?</strong><br>
                    Our admin team will review your submitted documents. Once verified, you'll receive another email confirming your activation.
                  </p>
                </div>
                
                ${ownerSection}
                
                <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #2d5016; margin: 0 0 10px 0;">📋 Your Registration Includes:</h3>
                  <ul style="color: #555; padding-left: 20px; margin: 0;">
                    <li>Driver profile and license details</li>
                    <li>Document verification pending</li>
                    <li>Access to browse available trips</li>
                    <li>Ability to submit bids on client requests</li>
                  </ul>
                </div>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                  While you wait for verification, feel free to explore the platform and familiarize yourself with available features.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://safarihirehub.com/driver/dashboard" 
                     style="display: inline-block; background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
                  Need help? Contact our support team
                </p>
                <p style="color: #888; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Safari Hire Hub. All rights reserved.
                </p>
                <p style="color: #aaa; font-size: 11px; margin: 15px 0 0 0;">
                  This email was sent to ${email} because you registered as a driver.
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
        to: [email],
        subject: `Welcome to Safari Hire Hub, ${fullName}! 🦁`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await res.json();
    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
