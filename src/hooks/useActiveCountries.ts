import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Country {
  id: string;
  code: string;
  name: string;
}

export function useActiveCountries() {
  return useQuery({
    queryKey: ["active-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("id, code, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Country[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
