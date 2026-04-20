import { useMemo, useState } from "react";
import { Loader2, MoreVertical, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  type AdminCompanyUserRow,
  useAdminCompanyUsersQuery,
  useCreateCompanyUserMutation,
  useDeleteCompanyUserMutation,
  useUpdateCompanyUserMutation,
} from "@/hooks/queries/useAdminUsers";

export function AdminUsers() {
  const { profile } = useAuth();
  const usersQuery = useAdminCompanyUsersQuery();
  const updateUserMutation = useUpdateCompanyUserMutation();
  const createUserMutation = useCreateCompanyUserMutation();
  const deleteUserMutation = useDeleteCompanyUserMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createPosition, setCreatePosition] = useState("");

  const [positionDialogUser, setPositionDialogUser] =
    useState<AdminCompanyUserRow | null>(null);
  const [positionDraft, setPositionDraft] = useState("");

  const [activeStatusUser, setActiveStatusUser] =
    useState<AdminCompanyUserRow | null>(null);
  const [activeStatusDraft, setActiveStatusDraft] = useState(true);
  const [confirmDeleteUser, setConfirmDeleteUser] =
    useState<AdminCompanyUserRow | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selfId = profile?.id ?? null;

  const createDisabled = useMemo(
    () =>
      createUserMutation.isPending ||
      !createEmail.trim() ||
      !createFullName.trim(),
    [createEmail, createFullName, createUserMutation.isPending],
  );

  async function handleCreateUser() {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await createUserMutation.mutateAsync({
        email: createEmail.trim(),
        full_name: createFullName.trim(),
        position: createPosition.trim() || null,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Create user failed.",
      );
      return;
    }
    setCreateEmail("");
    setCreateFullName("");
    setCreatePosition("");
    setIsCreateOpen(false);
    setSuccessMessage(
      "User created. They can sign in with the temporary password init123.",
    );
  }

  async function handleSavePosition() {
    if (!positionDialogUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateUserMutation.mutateAsync({
        userId: positionDialogUser.id,
        patch: { position: positionDraft.trim() || null },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Update failed.",
      );
      return;
    }
    setPositionDialogUser(null);
    setSuccessMessage("Position updated.");
  }

  function openActiveStatusDialog(row: AdminCompanyUserRow) {
    setActiveStatusDraft(row.is_active);
    setActiveStatusUser(row);
  }

  async function handleSaveActiveStatus() {
    const row = activeStatusUser;
    if (!row) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    if (activeStatusDraft === row.is_active) {
      setActiveStatusUser(null);
      return;
    }
    try {
      await updateUserMutation.mutateAsync({
        userId: row.id,
        patch: { is_active: activeStatusDraft },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Update failed.",
      );
      return;
    }
    setActiveStatusUser(null);
    setSuccessMessage(
      activeStatusDraft ? "User is now active." : "User is now inactive.",
    );
  }

  async function confirmDelete() {
    const row = confirmDeleteUser;
    if (!row) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteUserMutation.mutateAsync({ userId: row.id });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Delete failed.",
      );
      return;
    }
    setConfirmDeleteUser(null);
    setSuccessMessage("User removed.");
  }

  function openPositionDialog(row: AdminCompanyUserRow) {
    setPositionDraft(row.position ?? "");
    setPositionDialogUser(row);
  }

  const rowBusy = updateUserMutation.isPending || deleteUserMutation.isPending;

  return (
    <section className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage employee accounts: invite people, set access, and update
            details.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="gap-2">
              <Plus className="size-4" />
              Create user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>
                New accounts use the temporary password{" "}
                <span className="font-medium text-foreground">init123</span>.
                Ask them to change it after first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-email">
                  Email
                </label>
                <Input
                  id="create-email"
                  type="email"
                  autoComplete="off"
                  placeholder="name@company.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="create-name">
                  Full name
                </label>
                <Input
                  id="create-name"
                  placeholder="Jordan Lee"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="create-position"
                >
                  Position (optional)
                </label>
                <Input
                  id="create-position"
                  placeholder="People Partner"
                  value={createPosition}
                  onChange={(e) => setCreatePosition(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createDisabled}
                onClick={() => void handleCreateUser()}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-xl border bg-(--card)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-[52px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Loading users…
                </TableCell>
              </TableRow>
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                  Unable to load users.
                </TableCell>
              </TableRow>
            ) : !(usersQuery.data?.length ?? 0) ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No employee users in this company yet.
                </TableCell>
              </TableRow>
            ) : (
              (usersQuery.data ?? []).map((row) => {
                const isSelf = selfId !== null && row.id === selfId;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.full_name?.trim() || "—"}
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Badge variant={row.is_active ? "default" : "secondary"}>
                        {row.is_active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.position?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            disabled={rowBusy}
                            aria-label="Row actions"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          {!isSelf ? (
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                openActiveStatusDialog(row);
                              }}
                            >
                              Set active status…
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              openPositionDialog(row);
                            }}
                          >
                            Change position…
                          </DropdownMenuItem>
                          {!isSelf ? (
                            <>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setConfirmDeleteUser(row);
                                }}
                              >
                                Delete user
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={positionDialogUser !== null}
        onOpenChange={(open) => {
          if (!open) setPositionDialogUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change position</DialogTitle>
            <DialogDescription>
              Update the job title or role label for this person.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-position">
              Position
            </label>
            <Input
              id="edit-position"
              value={positionDraft}
              onChange={(e) => setPositionDraft(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPositionDialogUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updateUserMutation.isPending}
              onClick={() => void handleSavePosition()}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeStatusUser !== null}
        onOpenChange={(open) => {
          if (!open) setActiveStatusUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set active status</DialogTitle>
            <DialogDescription>
              Inactive users cannot sign in until you set them active again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {activeStatusUser?.full_name?.trim() || activeStatusUser?.email}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeStatusDraft ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveStatusDraft(true)}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={!activeStatusDraft ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveStatusDraft(false)}
              >
                Inactive
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStatusUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={updateUserMutation.isPending}
              onClick={() => void handleSaveActiveStatus()}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteUser !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This permanently removes their login and profile. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteUserMutation.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
