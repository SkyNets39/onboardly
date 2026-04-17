import { useQuery } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"

export function useUsersCountQuery() {
  return useQuery({
    queryKey: ["users-count"] as const,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase.from("users").select("id", { count: "exact", head: true })
      if (error) throw new Error("Unable to load users count.")
      return count ?? 0
    },
  })
}
