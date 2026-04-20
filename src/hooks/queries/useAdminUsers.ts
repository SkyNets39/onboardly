import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export const adminCompanyUsersQueryKey = ["admin-company-users"] as const;

export interface AdminCompanyUserRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  position: string | null;
  role: "admin" | "employee";
}

interface RpcRow {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  job_position: string | null;
  role: "admin" | "employee";
}

function isRpcRow(value: unknown): value is RpcRow {
  if (value === null || typeof value !== "object") return false;
  if (!("id" in value) || !("email" in value) || !("is_active" in value)) {
    return false;
  }
  const row = value as Record<string, unknown>;
  const jp = row.job_position;
  const jpOk = jp === null || jp === undefined || typeof jp === "string";
  return (
    typeof row.id === "string" &&
    typeof row.email === "string" &&
    typeof row.is_active === "boolean" &&
    (row.role === "admin" || row.role === "employee") &&
    jpOk
  );
}

function normalizeRpcRows(data: unknown): AdminCompanyUserRow[] {
  if (!Array.isArray(data)) return [];
  const out: AdminCompanyUserRow[] = [];
  for (const item of data) {
    if (!isRpcRow(item)) continue;
    out.push({
      id: item.id,
      email: item.email,
      full_name: item.full_name,
      is_active: item.is_active,
      position: item.job_position,
      role: item.role,
    });
  }
  return out;
}

export function useAdminCompanyUsersQuery() {
  return useQuery({
    queryKey: adminCompanyUsersQueryKey,
    queryFn: async (): Promise<AdminCompanyUserRow[]> => {
      const { data, error } = await supabase.rpc("admin_list_company_users");
      if (error) throw new Error(error.message || "Unable to load users.");
      return normalizeRpcRows(data).filter((row) => row.role === "employee");
    },
  });
}

interface UpdateCompanyUserArgs {
  userId: string;
  patch: { is_active?: boolean; position?: string | null };
}

export function useUpdateCompanyUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      patch,
    }: UpdateCompanyUserArgs): Promise<void> => {
      const { error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", userId);
      if (error) throw new Error(error.message || "Update failed.");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCompanyUsersQueryKey });
    },
  });
}

interface CreateCompanyUserArgs {
  email: string;
  full_name: string;
  position?: string | null;
}

interface CreateCompanyUserResult {
  id: string | null;
}

interface DeleteCompanyUserArgs {
  userId: string;
}

function getInvokeErrorMessage(error: { message: string }, data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return error.message;
}

export function useCreateCompanyUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      args: CreateCompanyUserArgs,
    ): Promise<CreateCompanyUserResult> => {
      const { data, error } = await supabase.functions.invoke<
        CreateCompanyUserResult & { error?: string }
      >("admin-users", {
        body: {
          action: "create",
          email: args.email,
          full_name: args.full_name,
          position: args.position ?? undefined,
        },
      });
      if (error) {
        throw new Error(getInvokeErrorMessage(error, data));
      }
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        throw new Error(data.error);
      }
      return {
        id:
          data &&
          typeof data === "object" &&
          "id" in data &&
          typeof (data as { id: unknown }).id === "string"
            ? (data as { id: string }).id
            : null,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCompanyUsersQueryKey });
    },
  });
}

export function useDeleteCompanyUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: DeleteCompanyUserArgs): Promise<void> => {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
      }>("admin-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) {
        throw new Error(getInvokeErrorMessage(error, data));
      }
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        throw new Error(data.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCompanyUsersQueryKey });
    },
  });
}
