import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PendingCompanyApprovals } from "@/components/admin/PendingCompanyApprovals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { Plus, Pencil } from "lucide-react";
import { AddFleetOwnerDialog } from "@/components/admin/AddFleetOwnerDialog";
import { EditFleetOwnerDialog } from "@/components/admin/EditFleetOwnerDialog";

const ManageFleetOwners = () => {
  const { toast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

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
      setOwners(data || []);
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
                <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {owner.entity_type === "company" ? owner.company_name : owner.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Type: {owner.entity_type}</p>
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
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={owner.entity_type === "company" ? "default" : "secondary"}>
                      {owner.entity_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(owner)}
                    >
                      <Pencil className="h-4 w-4" />
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
    </div>
  );
};

export default ManageFleetOwners;
