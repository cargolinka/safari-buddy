import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Award, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { RequirementDialog } from "./RequirementDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Requirement {
  id: string;
  name: string;
  description: string | null;
  requirement_type: string;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
}

export const DriverRequirementsSection = () => {
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from("driver_requirements")
        .select("*")
        .order("requirement_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setRequirements(data || []);
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

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("driver_requirements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setRequirements(prev =>
        prev.map(req =>
          req.id === id ? { ...req, is_active: !currentStatus } : req
        )
      );

      toast({
        title: "Success",
        description: `Requirement ${!currentStatus ? "activated" : "deactivated"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRequirement = async (id: string) => {
    try {
      const { error } = await supabase
        .from("driver_requirements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRequirements(prev => prev.filter(req => req.id !== id));

      toast({
        title: "Success",
        description: "Requirement deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRequirement(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "certification":
        return <Award className="h-4 w-4" />;
      case "qualification":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "document":
        return "default";
      case "certification":
        return "secondary";
      case "qualification":
        return "outline";
      default:
        return "default";
    }
  };

  const groupedRequirements = requirements.reduce((acc, req) => {
    const type = req.requirement_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(req);
    return acc;
  }, {} as Record<string, Requirement[]>);

  if (loading) {
    return <div>Loading requirements...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Driver Requirements</CardTitle>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedRequirements).map(([type, reqs]) => (
            <div key={type}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                {getTypeIcon(type)}
                {type}s
              </h4>
              <div className="space-y-2">
                {reqs.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      !req.is_active ? "opacity-50 bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.name}</span>
                        <Badge variant={getTypeBadgeVariant(req.requirement_type)}>
                          {req.requirement_type}
                        </Badge>
                        {req.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {req.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {req.is_active ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={req.is_active}
                          onCheckedChange={() => toggleActive(req.id, req.is_active)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(req)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{req.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRequirement(req.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {requirements.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No requirements defined yet. Add your first requirement.
            </p>
          )}
        </div>

        <RequirementDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          requirement={editingRequirement}
          onSuccess={fetchRequirements}
        />
      </CardContent>
    </Card>
  );
};
