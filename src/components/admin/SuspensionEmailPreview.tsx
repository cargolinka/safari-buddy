import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuspensionEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerName: string;
  isSuspension: boolean;
  suspensionReason?: string;
  suspensionNotes?: string;
  onConfirm: () => void;
}

export function SuspensionEmailPreview({
  open,
  onOpenChange,
  ownerName,
  isSuspension,
  suspensionReason,
  suspensionNotes,
  onConfirm,
}: SuspensionEmailPreviewProps) {
  const emailHtml = isSuspension
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Account Suspended</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Account Suspended</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${ownerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We regret to inform you that your Safari Buddy fleet owner account has been suspended.
            </p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #dc2626;">Suspension Reason:</p>
              <p style="margin: 0 0 10px 0; font-size: 16px;">${suspensionReason || "Not specified"}</p>
              ${suspensionNotes ? `
                <p style="margin: 10px 0 0 0; font-weight: bold; color: #dc2626;">Additional Details:</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${suspensionNotes}</p>
              ` : ''}
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">What this means:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">You will not be able to access your account</li>
                <li style="margin-bottom: 8px;">All your vehicles have been marked as unavailable</li>
                <li style="margin-bottom: 8px;">You cannot accept new bookings</li>
                <li>Your account will remain suspended until further notice</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; margin: 20px 0;">
              If you believe this suspension was made in error or would like to discuss this matter, 
              please contact our support team immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:support@safari-buddy.com" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Contact Support
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Safari Buddy. All rights reserved.</p>
            <p style="margin: 5px 0;">Professional Safari Vehicle Hire Platform</p>
          </div>
        </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Account Activated</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Account Activated</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${ownerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Good news! Your Safari Buddy fleet owner account has been reactivated.
            </p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #059669; font-size: 16px;">✓ Your account is now active</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">What's restored:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Full access to your account dashboard</li>
                <li style="margin-bottom: 8px;">All compliant vehicles are now available</li>
                <li style="margin-bottom: 8px;">Ability to accept new bookings</li>
                <li>All platform features are accessible</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; margin: 20px 0;">
              You can now log in and resume managing your fleet. Thank you for your cooperation during the suspension period.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://safari-buddy.lovable.app/auth" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Log In to Your Account
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Safari Buddy. All rights reserved.</p>
            <p style="margin: 5px 0;">Professional Safari Vehicle Hire Platform</p>
          </div>
        </body>
      </html>
    `;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>
            Preview of the {isSuspension ? "suspension" : "activation"} notification email that will be sent to {ownerName}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Preview</span>
              <span className="text-xs text-muted-foreground">
                Subject: Account {isSuspension ? "Suspended" : "Activated"} - Safari Buddy
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Confirm & Send Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
