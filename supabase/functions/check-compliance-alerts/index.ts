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

interface DocumentAlert {
  id: string;
  entity_id: string;
  entity_type: string;
  document_type: string;
  expiry_date: string;
  daysUntilExpiry: number;
  alertType: string;
  ownerEmail?: string;
  ownerName?: string;
}

// Define alert thresholds and configurations
const ALERT_THRESHOLDS = [
  { days: 14, type: '14_day', subject: '⚠️ REMINDER', color: '#F59E0B', urgency: 'low' },
  { days: 7, type: '7_day', subject: '⚠️ URGENT', color: '#F59E0B', urgency: 'medium' },
  { days: 3, type: '3_day', subject: '🔴 CRITICAL', color: '#DC2626', urgency: 'high' },
  { days: 0, type: 'expired', subject: '🔴 URGENT', color: '#DC2626', urgency: 'critical' },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting comprehensive compliance check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Fetch all documents with expiry dates
    const { data: allDocuments, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .not("expiry_date", "is", null)
      .order("expiry_date", { ascending: true });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    console.log(`Found ${allDocuments?.length || 0} documents with expiry dates`);

    const alertsToSend: DocumentAlert[] = [];
    const processedDocuments = new Set<string>();

    // Process each document and determine which alerts to send
    for (const doc of allDocuments || []) {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Skip if already processed
      if (processedDocuments.has(doc.id)) continue;
      processedDocuments.add(doc.id);

      // Determine which alert type this document qualifies for
      let alertType = null;
      let alertConfig = null;

      // Check post-expiry (weekly reminders for up to 30 days)
      if (daysUntilExpiry < 0 && daysUntilExpiry >= -30 && daysUntilExpiry % 7 === 0) {
        alertType = 'post_expiry';
        alertConfig = { days: daysUntilExpiry, type: 'post_expiry', subject: '🔴 OVERDUE', color: '#DC2626', urgency: 'critical' };
      } else {
        // Check standard thresholds
        for (const threshold of ALERT_THRESHOLDS) {
          if (daysUntilExpiry === threshold.days) {
            alertType = threshold.type;
            alertConfig = threshold;
            break;
          }
        }
      }

      // Skip if no alert needed for this document today
      if (!alertType || !alertConfig) continue;

      // Check if alert already sent today
      const { data: existingAlert } = await supabase
        .from("alert_history")
        .select("id")
        .eq("document_id", doc.id)
        .eq("alert_type", alertType)
        .gte("sent_at", todayStr)
        .maybeSingle();

      if (existingAlert) {
        console.log(`Alert already sent for document ${doc.id}, type ${alertType}`);
        continue;
      }

      // Fetch owner information
      let ownerEmail = "";
      let ownerName = "";

      if (doc.entity_type === "vehicle") {
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
        alertsToSend.push({
          ...doc,
          daysUntilExpiry,
          alertType,
          ownerEmail,
          ownerName,
          ...alertConfig
        });
      }
    }

    console.log(`Preparing to send ${alertsToSend.length} alerts`);

    // Send email alerts and record history
    const emailResults = [];
    for (const alert of alertsToSend) {
      try {
        const docTypeFormatted = alert.document_type.replace(/_/g, ' ').toUpperCase();
        const isExpired = alert.daysUntilExpiry <= 0;
        const isPostExpiry = alert.alertType === 'post_expiry';
        
        let statusMessage = '';
        let actionMessage = '';
        
        if (isPostExpiry) {
          statusMessage = `EXPIRED ${Math.abs(alert.daysUntilExpiry)} days ago`;
          actionMessage = `<p style="color: #DC2626; font-weight: bold;">⚠️ CRITICAL: This document is overdue by ${Math.abs(alert.daysUntilExpiry)} days. Please upload the renewed document immediately to restore compliance and avoid service suspension.</p>`;
        } else if (isExpired) {
          statusMessage = 'EXPIRED TODAY';
          actionMessage = `<p style="color: #DC2626; font-weight: bold;">⚠️ URGENT: Your document has expired today. Please update it immediately to avoid service disruption.</p>`;
        } else {
          statusMessage = `Expires in ${alert.daysUntilExpiry} days`;
          actionMessage = `<p><strong>Action Required:</strong> Please renew this document before it expires to maintain compliance and avoid service interruption.</p>`;
        }
        
        const emailResponse = await resend.emails.send({
          from: "Safari Hire Platform <onboarding@resend.dev>",
          to: [alert.ownerEmail!],
          subject: `${alert.subject}: ${docTypeFormatted} ${isExpired || isPostExpiry ? 'Has Expired' : `Expires in ${alert.daysUntilExpiry} Days`}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid ${alert.color}; border-radius: 8px;">
              <div style="background: ${alert.color}; padding: 20px; border-radius: 6px 6px 0 0;">
                <h1 style="color: #ffffff; margin: 0;">
                  ${alert.subject} Document ${isExpired || isPostExpiry ? 'Expired' : 'Expiring Soon'}
                </h1>
              </div>
              
              <div style="padding: 30px;">
                <p style="font-size: 16px;">Dear ${alert.ownerName},</p>
                <p style="font-size: 16px;">This is an automated ${alert.urgency === 'critical' ? '<strong>CRITICAL</strong>' : ''} alert regarding your compliance documentation.</p>
                
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${alert.color};">
                  <p style="margin: 5px 0;"><strong>Document Type:</strong> ${docTypeFormatted}</p>
                  <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${new Date(alert.expiry_date).toLocaleDateString()}</p>
                  <p style="margin: 5px 0; color: ${alert.color}; font-size: 18px; font-weight: bold;"><strong>Status:</strong> ${statusMessage}</p>
                  <p style="margin: 5px 0;"><strong>Urgency Level:</strong> ${alert.urgency.toUpperCase()}</p>
                </div>
                
                ${actionMessage}
                
                <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">📋 To update your documents:</p>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Log in to your Safari Hire Platform account</li>
                    <li>Navigate to your ${alert.entity_type === 'vehicle' ? 'Vehicles' : 'Profile'} section</li>
                    <li>Upload the renewed/updated document</li>
                    <li>Wait for admin verification (if required)</li>
                  </ol>
                </div>
                
                ${alert.urgency === 'critical' ? `
                  <div style="background: #FEE2E2; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #DC2626;">
                    <p style="margin: 0; color: #DC2626; font-weight: bold;">⚠️ COMPLIANCE WARNING</p>
                    <p style="margin: 10px 0 0 0;">Your ${alert.entity_type} may be marked as non-compliant and unavailable for bookings until this document is updated.</p>
                  </div>
                ` : ''}
                
                <p style="margin-top: 30px; color: #6B7280;">If you have already renewed this document, please upload it to the platform to update our records.</p>
                
                <p style="margin-top: 30px; color: #6B7280;">If you have any questions, please contact our support team.</p>
                
                <p style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                  Best regards,<br>
                  <strong>Safari Hire Platform Team</strong>
                </p>
              </div>
            </div>
          `,
        });

        // Record alert in history
        await supabase.from("alert_history").insert({
          document_id: alert.id,
          alert_type: alert.alertType,
          sent_to: alert.ownerEmail,
          days_until_expiry: alert.daysUntilExpiry,
        });

        console.log(`Alert sent to ${alert.ownerEmail} for ${alert.document_type} (${alert.alertType})`);
        emailResults.push({ 
          email: alert.ownerEmail, 
          success: true, 
          documentType: alert.document_type,
          alertType: alert.alertType,
          daysUntilExpiry: alert.daysUntilExpiry
        });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${alert.ownerEmail}:`, emailError);
        emailResults.push({ 
          email: alert.ownerEmail, 
          success: false, 
          error: emailError.message,
          documentType: alert.document_type
        });
      }
    }

    // Send admin daily summary if alerts were sent
    if (alertsToSend.length > 0) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      // Group alerts by urgency
      const criticalAlerts = alertsToSend.filter(a => a.urgency === 'critical');
      const highAlerts = alertsToSend.filter(a => a.urgency === 'high');
      const mediumAlerts = alertsToSend.filter(a => a.urgency === 'medium');
      const lowAlerts = alertsToSend.filter(a => a.urgency === 'low');

      if (adminRoles && adminRoles.length > 0) {
        for (const adminRole of adminRoles) {
          try {
            const { data: { user } } = await supabase.auth.admin.getUserById(adminRole.user_id);
            
            if (user?.email) {
              await resend.emails.send({
                from: "Safari Hire Platform <onboarding@resend.dev>",
                to: [user.email],
                subject: `Daily Compliance Report: ${alertsToSend.length} Alerts Sent`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
                    <h1 style="color: #1F2937;">📊 Daily Compliance Monitoring Report</h1>
                    <p style="color: #6B7280; font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    
                    <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0;">Summary</h3>
                      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <p><strong>Total Alerts Sent:</strong> ${alertsToSend.length}</p>
                        <p><strong>Successful:</strong> ${emailResults.filter(r => r.success).length}</p>
                        <p style="color: #DC2626;"><strong>Critical:</strong> ${criticalAlerts.length}</p>
                        <p style="color: #F59E0B;"><strong>High:</strong> ${highAlerts.length}</p>
                        <p style="color: #F59E0B;"><strong>Medium:</strong> ${mediumAlerts.length}</p>
                        <p style="color: #3B82F6;"><strong>Low:</strong> ${lowAlerts.length}</p>
                      </div>
                    </div>
                    
                    ${criticalAlerts.length > 0 ? `
                      <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
                        <h3 style="color: #DC2626; margin-top: 0;">🔴 Critical Alerts (${criticalAlerts.length})</h3>
                        <p style="font-size: 14px;">These documents require immediate attention:</p>
                        <ul>
                          ${criticalAlerts.slice(0, 5).map(a => `
                            <li><strong>${a.ownerName}</strong> - ${a.document_type.replace(/_/g, ' ')} (${a.daysUntilExpiry <= 0 ? `Expired ${Math.abs(a.daysUntilExpiry)} days ago` : 'Expires today'})</li>
                          `).join('')}
                          ${criticalAlerts.length > 5 ? `<li><em>...and ${criticalAlerts.length - 5} more</em></li>` : ''}
                        </ul>
                      </div>
                    ` : ''}
                    
                    <h3>All Alerts Breakdown</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <thead>
                        <tr style="background: #E5E7EB;">
                          <th style="padding: 12px; text-align: left; border: 1px solid #D1D5DB;">Owner</th>
                          <th style="padding: 12px; text-align: left; border: 1px solid #D1D5DB;">Document</th>
                          <th style="padding: 12px; text-align: left; border: 1px solid #D1D5DB;">Alert Type</th>
                          <th style="padding: 12px; text-align: left; border: 1px solid #D1D5DB;">Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${alertsToSend.map(alert => `
                          <tr>
                            <td style="padding: 10px; border: 1px solid #D1D5DB;">${alert.ownerName}</td>
                            <td style="padding: 10px; border: 1px solid #D1D5DB;">${alert.document_type.replace(/_/g, ' ')}</td>
                            <td style="padding: 10px; border: 1px solid #D1D5DB;">
                              <span style="background: ${alert.color}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                                ${alert.alertType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style="padding: 10px; border: 1px solid #D1D5DB; color: ${alert.color}; font-weight: bold;">
                              ${alert.daysUntilExpiry <= 0 ? `${Math.abs(alert.daysUntilExpiry)} (overdue)` : alert.daysUntilExpiry}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    
                    <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
                      This is an automated daily report from Safari Hire Platform.<br>
                      Report generated at: ${new Date().toLocaleString()}
                    </p>
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
    } else {
      console.log("No alerts to send today - all documents compliant");
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentsChecked: allDocuments?.length || 0,
        alertsSent: alertsToSend.length,
        emailResults,
        summary: {
          critical: alertsToSend.filter(a => a.urgency === 'critical').length,
          high: alertsToSend.filter(a => a.urgency === 'high').length,
          medium: alertsToSend.filter(a => a.urgency === 'medium').length,
          low: alertsToSend.filter(a => a.urgency === 'low').length,
        }
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
