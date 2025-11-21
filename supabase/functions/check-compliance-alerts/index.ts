import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpiringDocument {
  id: string;
  entity_id: string;
  entity_type: string;
  document_type: string;
  expiry_date: string;
  daysUntilExpiry: number;
  ownerEmail?: string;
  ownerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting compliance check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate date 14 days from now
    const today = new Date();
    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(today.getDate() + 14);
    
    const todayStr = today.toISOString().split('T')[0];
    const fourteenDaysStr = fourteenDaysFromNow.toISOString().split('T')[0];
    
    console.log(`Checking documents expiring between ${todayStr} and ${fourteenDaysStr}`);

    // Fetch expiring documents
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .gte("expiry_date", todayStr)
      .lte("expiry_date", fourteenDaysStr);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    console.log(`Found ${documents?.length || 0} expiring documents`);

    const expiringDocs: ExpiringDocument[] = [];

    // Process each document and fetch owner info
    for (const doc of documents || []) {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let ownerEmail = "";
      let ownerName = "";

      if (doc.entity_type === "vehicle") {
        // Fetch vehicle owner
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("owner_id")
          .eq("id", doc.entity_id)
          .single();

        if (vehicle) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", vehicle.owner_id)
            .single();

          const { data: { user } } = await supabase.auth.admin.getUserById(vehicle.owner_id);
          
          ownerEmail = user?.email || "";
          ownerName = profile?.full_name || "Vehicle Owner";
        }
      } else if (doc.entity_type === "driver") {
        // Fetch driver info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", doc.entity_id)
          .single();

        const { data: { user } } = await supabase.auth.admin.getUserById(doc.entity_id);
        
        ownerEmail = user?.email || "";
        ownerName = profile?.full_name || "Driver";
      }

      if (ownerEmail) {
        expiringDocs.push({
          ...doc,
          daysUntilExpiry,
          ownerEmail,
          ownerName,
        });
      }
    }

    console.log(`Sending alerts for ${expiringDocs.length} documents`);

    // Send email alerts
    const emailResults = [];
    for (const doc of expiringDocs) {
      try {
        const docTypeFormatted = doc.document_type.replace(/_/g, ' ').toUpperCase();
        const isExpired = doc.daysUntilExpiry === 0;
        
        const emailResponse = await resend.emails.send({
          from: "Safari Hire Platform <onboarding@resend.dev>",
          to: [doc.ownerEmail!],
          subject: isExpired 
            ? `URGENT: ${docTypeFormatted} Has Expired` 
            : `REMINDER: ${docTypeFormatted} Expires in ${doc.daysUntilExpiry} Days`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: ${isExpired ? '#DC2626' : '#F59E0B'};">
                ${isExpired ? '🔴 Document Expired' : '⚠️ Document Expiring Soon'}
              </h1>
              <p>Dear ${doc.ownerName},</p>
              <p>This is an automated reminder about your ${docTypeFormatted} document.</p>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Document Type:</strong> ${docTypeFormatted}</p>
                <p><strong>Expiry Date:</strong> ${new Date(doc.expiry_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${isExpired ? 'EXPIRED' : `Expires in ${doc.daysUntilExpiry} days`}</p>
              </div>
              
              ${isExpired 
                ? `<p style="color: #DC2626;"><strong>Action Required:</strong> Your document has expired. Please update it immediately to avoid service disruption.</p>`
                : `<p><strong>Action Required:</strong> Please renew this document before it expires to maintain compliance and avoid service interruption.</p>`
              }
              
              <p>To update your documents:</p>
              <ol>
                <li>Log in to your Safari Hire Platform account</li>
                <li>Navigate to your ${doc.entity_type === 'vehicle' ? 'Vehicles' : 'Profile'} section</li>
                <li>Upload the updated document</li>
              </ol>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>Safari Hire Platform Team</p>
            </div>
          `,
        });

        console.log(`Email sent to ${doc.ownerEmail} for ${doc.document_type}`);
        emailResults.push({ email: doc.ownerEmail, success: true, documentType: doc.document_type });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${doc.ownerEmail}:`, emailError);
        emailResults.push({ email: doc.ownerEmail, success: false, error: emailError.message });
      }
    }

    // Fetch admin emails
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    // Send admin summary
    if (adminRoles && adminRoles.length > 0 && expiringDocs.length > 0) {
      for (const adminRole of adminRoles) {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(adminRole.user_id);
          
          if (user?.email) {
            await resend.emails.send({
              from: "Safari Hire Platform <onboarding@resend.dev>",
              to: [user.email],
              subject: `Compliance Alert: ${expiringDocs.length} Documents Expiring Soon`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #F59E0B;">📊 Compliance Status Report</h1>
                  <p>Dear Admin,</p>
                  <p>This is your daily compliance monitoring report.</p>
                  
                  <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Summary</h3>
                    <p><strong>Total Documents Expiring Soon:</strong> ${expiringDocs.length}</p>
                    <p><strong>Alerts Sent:</strong> ${emailResults.filter(r => r.success).length}</p>
                  </div>
                  
                  <h3>Expiring Documents:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: #E5E7EB;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #D1D5DB;">Owner</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #D1D5DB;">Document</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #D1D5DB;">Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${expiringDocs.map(doc => `
                        <tr>
                          <td style="padding: 8px; border: 1px solid #D1D5DB;">${doc.ownerName}</td>
                          <td style="padding: 8px; border: 1px solid #D1D5DB;">${doc.document_type.replace(/_/g, ' ')}</td>
                          <td style="padding: 8px; border: 1px solid #D1D5DB; color: ${doc.daysUntilExpiry <= 3 ? '#DC2626' : '#F59E0B'};">
                            ${doc.daysUntilExpiry} days
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <p style="margin-top: 30px;">Best regards,<br>Safari Hire Platform System</p>
                </div>
              `,
            });
            console.log(`Admin summary sent to ${user.email}`);
          }
        } catch (adminEmailError) {
          console.error("Failed to send admin email:", adminEmailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentsChecked: documents?.length || 0,
        alertsSent: expiringDocs.length,
        emailResults,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in check-compliance-alerts function:", error);
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
