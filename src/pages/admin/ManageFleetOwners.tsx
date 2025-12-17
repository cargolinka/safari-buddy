import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PendingCompanyApprovals } from "@/components/admin/PendingCompanyApprovals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { Plus, Pencil, Ban, CheckCircle, AlertCircle, Eye, Trash2 } from "lucide-react";
import { AddFleetOwnerDialog } from "@/components/admin/AddFleetOwnerDialog";
import { EditFleetOwnerDialog } from "@/components/admin/EditFleetOwnerDialog";
import { SuspensionEmailPreview } from "@/components/admin/SuspensionEmailPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const ManageFleetOwners = () => {
  const { toast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [ownerToSuspend, setOwnerToSuspend] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionNotes, setSuspensionNotes] = useState("");
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFleetOwners();
  }, []);

  const fetchFleetOwners = async () => {
    try {
      // Fetch all fleet owners
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_fleet_owner", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user roles for all fleet owners
      const ownerIds = (data || []).map(o => o.id);
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ownerIds);

      if (rolesError) throw rolesError;

      // Map roles to owners
      const rolesMap = new Map<string, string[]>();
      (rolesData || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Attach roles to each owner
      const ownersWithRoles = (data || []).map(owner => ({
        ...owner,
        roles: rolesMap.get(owner.id) || []
      }));

      // Fetch pending companies (those with unverified documents)
      const { data: pendingCompaniesData, error: pendingError } = await supabase
        .from("profiles")
        .select(`
          *,
          directors:company_directors(*),
          documents:company_documents(*)
        `)
        .eq("entity_type", "company")
        .eq("is_fleet_owner", true);

      if (pendingError) throw pendingError;
      
      // Filter companies with unverified documents
      const pending = (pendingCompaniesData || []).filter(company => 
        company.documents.some((doc: any) => !doc.verified_by_admin)
      );

      setPendingCompanies(pending);
      setOwners(ownersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "bg-violet-500/20 text-violet-700 border-violet-300";
      case "driver": return "bg-blue-500/20 text-blue-700 border-blue-300";
      case "owner": return "bg-green-500/20 text-green-700 border-green-300";
      case "client_corporate": return "bg-orange-500/20 text-orange-700 border-orange-300";
      case "client_individual": return "bg-gray-500/20 text-gray-700 border-gray-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "driver": return "Driver";
      case "owner": return "Owner";
      case "client_corporate": return "Corporate";
      case "client_individual": return "Individual";
      default: return role;
    }
  };

  const filteredOwners = selectedCountry === "all"
    ? owners
    : owners.filter(o => o.country === selectedCountry);

  const filteredPendingCompanies = selectedCountry === "all"
    ? pendingCompanies
    : pendingCompanies.filter(c => c.country === selectedCountry);

  const handleEdit = (owner: any) => {
    setSelectedOwner(owner);
    setEditDialogOpen(true);
  };

  const handleSuspendClick = (owner: any) => {
    setOwnerToSuspend(owner);
    setSuspendDialogOpen(true);
  };

  const handleToggleSuspension = async () => {
    if (!ownerToSuspend) return;

    const newStatus = ownerToSuspend.account_status === "suspended" ? "active" : "suspended";

    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: any = { account_status: newStatus };

      if (newStatus === "suspended") {
        // Add suspension tracking when suspending
        updateData.suspension_reason = suspensionReason;
        updateData.suspension_notes = suspensionNotes;
        updateData.suspended_at = new Date().toISOString();
        updateData.suspended_by = user?.id;
      }
      // Clearing of suspension fields is handled by the trigger

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", ownerToSuspend.id);

      if (error) throw error;

      // Send email notification
      try {
        const emailData = {
          ownerEmail: ownerToSuspend.email,
          ownerName: ownerToSuspend.entity_type === "company" 
            ? ownerToSuspend.company_name 
            : ownerToSuspend.full_name,
          isSuspension: newStatus === "suspended",
          suspensionReason: newStatus === "suspended" ? suspensionReason : undefined,
          suspensionNotes: newStatus === "suspended" ? suspensionNotes : undefined,
          suspendedAt: newStatus === "suspended" ? new Date().toISOString() : undefined,
        };

        const { error: emailError } = await supabase.functions.invoke("send-suspension-email", {
          body: emailData,
        });

        if (emailError) {
          console.error("Failed to send email:", emailError);
          // Don't block the suspension, just log the error
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      toast({
        title: newStatus === "suspended" ? "Account Suspended" : "Account Activated",
        description: `Fleet owner account has been ${newStatus === "suspended" ? "suspended" : "activated"} successfully. Email notification sent.`,
      });

      fetchFleetOwners();
      setSuspensionReason("");
      setSuspensionNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSuspendDialogOpen(false);
      setOwnerToSuspend(null);
    }
  };

  const handleDeleteClick = (owner: any) => {
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ownerToDelete) return;

    setDeleting(true);
    try {
      // Delete user roles first
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", ownerToDelete.id);

      if (rolesError) throw rolesError;

      // Delete the profile (this will cascade to related data)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", ownerToDelete.id);

      if (error) throw error;

      toast({
        title: "Fleet Owner Deleted",
        description: `${ownerToDelete.entity_type === "company" ? ownerToDelete.company_name : ownerToDelete.full_name} has been deleted successfully.`,
      });

      fetchFleetOwners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fleet Owners</h2>
          <p className="text-muted-foreground">Manage fleet owners and companies</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fleet Owner
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PendingCompanyApprovals companies={filteredPendingCompanies} onUpdate={fetchFleetOwners} />

      <Card>
        <CardHeader>
          <CardTitle>All Fleet Owners</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredOwners.map((owner) => (
                <div 
                  key={owner.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    owner.account_status === "suspended" ? "bg-muted/50 opacity-75" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {owner.entity_type === "company" ? owner.company_name : owner.full_name}
                      </p>
                      <Badge 
                        variant={owner.account_status === "suspended" ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {owner.account_status === "suspended" ? "Suspended" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Type: {owner.entity_type || "Not set"}</p>
                    {owner.roles && owner.roles.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-muted-foreground">Roles:</span>
                        {owner.roles.map((role: string) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeVariant(role)}`}
                          >
                            {getRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    )}
                    {owner.entity_type === "company" && (
                      <>
                        <p className="text-sm text-muted-foreground">Reg: {owner.company_registration_number}</p>
                        <p className="text-sm text-muted-foreground">PIN: {owner.company_pin}</p>
                      </>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {owner.email && `${owner.email} • `}
                      {owner.phone && `${owner.phone}`}
                    </p>
                    {owner.country && (
                      <p className="text-sm text-muted-foreground">Country: {owner.country}</p>
                    )}
                    {owner.account_status === "suspended" && owner.suspension_reason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">
                              Suspended: {owner.suspension_reason}
                            </p>
                            {owner.suspension_notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {owner.suspension_notes}
                              </p>
                            )}
                            {owner.suspended_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                On {format(new Date(owner.suspended_at), "PPp")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={owner.entity_type === "company" ? "default" : "secondary"}>
                      {owner.entity_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(owner)}
                      title="Edit owner"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSuspendClick(owner)}
                      title={owner.account_status === "suspended" ? "Activate account" : "Suspend account"}
                    >
                      {owner.account_status === "suspended" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(owner)}
                      title="Delete fleet owner"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFleetOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchFleetOwners}
      />

      <EditFleetOwnerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        owner={selectedOwner}
        onSuccess={fetchFleetOwners}
      />

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ownerToSuspend?.account_status === "suspended" 
                ? "Activate Fleet Owner Account" 
                : "Suspend Fleet Owner Account"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ownerToSuspend?.account_status === "suspended" ? (
                <>
                  Are you sure you want to activate{" "}
                  <strong>
                    {ownerToSuspend?.entity_type === "company" 
                      ? ownerToSuspend?.company_name 
                      : ownerToSuspend?.full_name}
                  </strong>
                  ? They will regain access to their account and all features.
                  <br /><br />
                  <span className="text-sm">
                    ✓ All compliant vehicles will automatically be restored to available status
                  </span>
                  {ownerToSuspend?.suspension_reason && (
                    <div className="mt-3 p-3 bg-muted rounded text-sm">
                      <p className="font-medium">Current Suspension Details:</p>
                      <p className="mt-1">Reason: {ownerToSuspend.suspension_reason}</p>
                      {ownerToSuspend.suspension_notes && (
                        <p className="mt-1">Notes: {ownerToSuspend.suspension_notes}</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p>
                    Are you sure you want to suspend{" "}
                    <strong>
                      {ownerToSuspend?.entity_type === "company" 
                        ? ownerToSuspend?.company_name 
                        : ownerToSuspend?.full_name}
                    </strong>
                    ? They will be logged out and unable to access their account until reactivated.
                  </p>
                  <p className="text-sm font-medium text-destructive">
                    ⚠ All their vehicles will automatically be marked as unavailable
                  </p>
                  
                  <div className="space-y-3 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="suspension-reason">Suspension Reason *</Label>
                      <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                        <SelectTrigger id="suspension-reason">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Policy Violation">Policy Violation</SelectItem>
                          <SelectItem value="Payment Issues">Payment Issues</SelectItem>
                          <SelectItem value="Fraudulent Activity">Fraudulent Activity</SelectItem>
                          <SelectItem value="Safety Concerns">Safety Concerns</SelectItem>
                          <SelectItem value="Document Issues">Document Issues</SelectItem>
                          <SelectItem value="Compliance Failure">Compliance Failure</SelectItem>
                          <SelectItem value="Customer Complaints">Customer Complaints</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="suspension-notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="suspension-notes"
                        value={suspensionNotes}
                        onChange={(e) => setSuspensionNotes(e.target.value)}
                        placeholder="Provide detailed information about the suspension..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEmailPreviewOpen(true)}
                        disabled={!suspensionReason}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Email
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        See what the notification will look like
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSuspensionReason("");
              setSuspensionNotes("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleSuspension}
              disabled={ownerToSuspend?.account_status !== "suspended" && !suspensionReason}
              className={
                ownerToSuspend?.account_status === "suspended"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {ownerToSuspend?.account_status === "suspended" ? "Activate" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddFleetOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchFleetOwners}
      />

      <EditFleetOwnerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        owner={selectedOwner}
        onSuccess={fetchFleetOwners}
      />

      <SuspensionEmailPreview
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        ownerName={
          ownerToSuspend?.entity_type === "company"
            ? ownerToSuspend?.company_name
            : ownerToSuspend?.full_name
        }
        isSuspension={ownerToSuspend?.account_status !== "suspended"}
        suspensionReason={suspensionReason}
        suspensionNotes={suspensionNotes}
        onConfirm={() => {
          setSuspendDialogOpen(false);
          handleToggleSuspension();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fleet Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>
                {ownerToDelete?.entity_type === "company"
                  ? ownerToDelete?.company_name
                  : ownerToDelete?.full_name}
              </strong>
              ? This action cannot be undone and will also remove all associated data including vehicles and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageFleetOwners;
