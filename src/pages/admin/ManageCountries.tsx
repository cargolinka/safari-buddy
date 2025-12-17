import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Globe } from "lucide-react";

interface Country {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

const ManageCountries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: countries, isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Country[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("countries")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      toast({
        title: "Success",
        description: `Country ${variables.is_active ? "activated" : "deactivated"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCountries = countries?.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = countries?.filter((c) => c.is_active).length || 0;
  const totalCount = countries?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Countries</h2>
          <p className="text-muted-foreground">
            Activate or deactivate countries for user registration
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {activeCount} of {totalCount} active
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Countries
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading countries...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCountries?.map((country) => (
                <div
                  key={country.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    country.is_active
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {country.code}
                    </Badge>
                    <span className="font-medium">{country.name}</span>
                  </div>
                  <Switch
                    checked={country.is_active}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: country.id, is_active: checked })
                    }
                    disabled={toggleMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}
          {filteredCountries?.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No countries found matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageCountries;
