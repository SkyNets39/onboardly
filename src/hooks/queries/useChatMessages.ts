import { useQuery } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"

interface ChatMessageRow {
  content: string
}

export interface TopQuestion {
  content: string
  count: number
}

export function useTopQuestionsQuery(limit = 5) {
  return useQuery({
    queryKey: ["top-questions", limit] as const,
    queryFn: async (): Promise<TopQuestion[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("content")
        .eq("role", "user")

      if (error) throw new Error("Unable to load top questions.")

      const frequencyMap = ((data ?? []) as ChatMessageRow[]).reduce<Map<string, number>>((acc, row) => {
        const question = row.content.trim()
        if (!question) return acc
        acc.set(question, (acc.get(question) ?? 0) + 1)
        return acc
      }, new Map<string, number>())

      return Array.from(frequencyMap.entries())
        .map(([content, count]) => ({ content, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    },
  })
}
