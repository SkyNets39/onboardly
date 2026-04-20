import { useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  type AdminCompanyUserRow,
  useAdminCompanyUsersQuery,
  useCreateCompanyUserMutation,
  useDeleteCompanyUserMutation,
  useUpdateCompanyUserMutation,
} from "@/hooks/queries/useAdminUsers";

export function useAdminUsers() {
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

  return {
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
  };
}
