import { useEffect } from "react";
import { Loader2, MoreVertical, Plus } from "lucide-react";
import toast from "react-hot-toast";

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

import { useAdminUsers } from "./useAdminUsers";

export function AdminUsers() {
  const {
    usersQuery,
    updateUserMutation,
    createUserMutation,
    deleteUserMutation,
    isCreateOpen,
    setIsCreateOpen,
    createEmail,
    setCreateEmail,
    createFullName,
    setCreateFullName,
    createPosition,
    setCreatePosition,
    positionDialogUser,
    setPositionDialogUser,
    positionDraft,
    setPositionDraft,
    activeStatusUser,
    setActiveStatusUser,
    activeStatusDraft,
    setActiveStatusDraft,
    confirmDeleteUser,
    setConfirmDeleteUser,
    errorMessage,
    successMessage,
    selfId,
    createDisabled,
    handleCreateUser,
    handleSavePosition,
    openActiveStatusDialog,
    handleSaveActiveStatus,
    confirmDelete,
    openPositionDialog,
    rowBusy,
  } = useAdminUsers();

  useEffect(() => {
    if (!successMessage) return;
    toast.success(successMessage);
  }, [successMessage]);

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

      <div className="rounded-xl border border-neutral-border bg-(--card)">
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
                      {row.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="error" className="">
                          Inactive
                        </Badge>
                      )}
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
                              Set active status
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              openPositionDialog(row);
                            }}
                          >
                            Change position
                          </DropdownMenuItem>
                          {!isSelf ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setConfirmDeleteUser(row);
                              }}
                              className="text-error"
                            >
                              Delete user
                            </DropdownMenuItem>
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
