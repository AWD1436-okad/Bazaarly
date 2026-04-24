"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SettingsActionsProps = {
  username: string;
  displayName: string;
  currentShopName: string | null;
  canRenameStore: boolean;
};

type ActionState = {
  message: string | null;
  error: string | null;
};

const initialState: ActionState = {
  message: null,
  error: null,
};

export function SettingsActions({
  username,
  displayName,
  currentShopName,
  canRenameStore,
}: SettingsActionsProps) {
  const router = useRouter();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [displayNameOpen, setDisplayNameOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nextUsername, setNextUsername] = useState(username);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [nextDisplayName, setNextDisplayName] = useState(displayName);
  const [displayNamePassword, setDisplayNamePassword] = useState("");
  const [renameName, setRenameName] = useState(currentShopName ?? "");
  const [renamePassword, setRenamePassword] = useState("");
  const [logoutPassword, setLogoutPassword] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [submitting, setSubmitting] = useState<
    null | "username" | "displayName" | "rename" | "logout" | "delete"
  >(null);
  const [state, setState] = useState<ActionState>(initialState);

  function resetMessages() {
    setState(initialState);
  }

  async function handleUsernameChange() {
    setSubmitting("username");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("username", nextUsername);
      formData.set("password", usernamePassword);

      const response = await fetch("/settings/rename-username", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        username?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Username change failed");
      }

      setState({ message: payload.message ?? "Username changed successfully", error: null });
      setNextUsername(payload.username ?? nextUsername);
      setUsernamePassword("");
      setUsernameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Username change failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDisplayNameChange() {
    setSubmitting("displayName");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("displayName", nextDisplayName);
      formData.set("password", displayNamePassword);

      const response = await fetch("/settings/rename-display-name", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        displayName?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Display name change failed");
      }

      setState({ message: payload.message ?? "Display name changed successfully", error: null });
      setNextDisplayName(payload.displayName ?? nextDisplayName);
      setDisplayNamePassword("");
      setDisplayNameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Display name change failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRename() {
    setSubmitting("rename");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("name", renameName);
      formData.set("password", renamePassword);

      const response = await fetch("/settings/rename-store", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Store rename failed");
      }

      setState({ message: payload.message ?? "Store renamed successfully", error: null });
      setRenamePassword("");
      setRenameOpen(false);
      router.refresh();
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Store rename failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteAccount() {
    setSubmitting("delete");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("username", deleteUsername);
      formData.set("password", deletePassword);
      formData.set("confirmation", deleteConfirmation);

      const response = await fetch("/settings/delete-account", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Account deletion failed");
      }

      window.location.assign(payload.redirectTo ?? "/login?deleted=1");
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Account deletion failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function handleLogout() {
    setSubmitting("logout");
    resetMessages();

    try {
      const formData = new FormData();
      formData.set("password", logoutPassword);

      const response = await fetch("/auth/logout", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Logout failed");
      }

      window.location.assign(payload.redirectTo ?? "/login");
    } catch (error) {
      setState({
        message: null,
        error: error instanceof Error ? error.message : "Logout failed",
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="settings-actions">
      {state.message ? (
        <div className="status-banner status-banner--success">
          <div>
            <h3>{state.message}</h3>
            <p>Your account settings have been updated.</p>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <div className="status-banner status-banner--error">
          <div>
            <h3>Action blocked</h3>
            <p>{state.error}</p>
          </div>
        </div>
      ) : null}

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Change Username</h2>
            <p>Update your login handle after password confirmation.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setNextUsername(username);
              setUsernamePassword("");
              setUsernameOpen(true);
            }}
            disabled={submitting !== null}
          >
            Change Username
          </button>
        </div>
        <p className="muted">Current username: @{username}</p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Change Display Name</h2>
            <p>Update the name other users see across orders, sales, and account screens.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setNextDisplayName(displayName);
              setDisplayNamePassword("");
              setDisplayNameOpen(true);
            }}
            disabled={submitting !== null}
          >
            Change Display Name
          </button>
        </div>
        <p className="muted">Current display name: {displayName}</p>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Rename Store</h2>
            <p>Cost: $200.00. This updates your public shop name after password confirmation.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setRenameOpen(true);
            }}
            disabled={!canRenameStore || submitting !== null}
          >
            Rename Store
          </button>
        </div>
        {!canRenameStore ? (
          <p className="muted">Create a shop before renaming it.</p>
        ) : (
          <p className="muted">Current store name: {currentShopName}</p>
        )}
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Logout</h2>
            <p>Sign out of this device after confirming your password.</p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              resetMessages();
              setLogoutPassword("");
              setLogoutOpen(true);
            }}
            disabled={submitting !== null}
          >
            Logout
          </button>
        </div>
        <p className="muted">Easy to find here, but no longer exposed in the main navigation.</p>
      </section>

      <section className="card settings-card settings-card--danger">
        <div className="card-header">
          <div className="card-header__copy">
            <h2>Delete Account</h2>
            <p>This deactivates your account, hides your shop, and signs you out.</p>
          </div>
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              resetMessages();
              setDeleteOpen(true);
            }}
            disabled={submitting !== null}
          >
            Delete Account
          </button>
        </div>
        <p className="muted">
          Order history stays available for marketplace integrity, but your account can no longer
          be used.
        </p>
      </section>

      {usernameOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setUsernameOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-username-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="change-username-title">Change Username</h3>
              <p>Use 3-24 letters, numbers, underscores, or hyphens.</p>
            </div>
            <label className="modal-card__field">
              New username
              <input
                value={nextUsername}
                onChange={(event) => setNextUsername(event.target.value)}
                autoComplete="username"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <input
                value={usernamePassword}
                onChange={(event) => setUsernamePassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setUsernameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUsernameChange()}
                disabled={submitting !== null}
              >
                {submitting === "username" ? "Changing..." : "Change Username"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {displayNameOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setDisplayNameOpen(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-display-name-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="change-display-name-title">Change Display Name</h3>
              <p>Enter the name people should see across Bazaarly.</p>
            </div>
            <label className="modal-card__field">
              New display name
              <input
                value={nextDisplayName}
                onChange={(event) => setNextDisplayName(event.target.value)}
                autoComplete="name"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <input
                value={displayNamePassword}
                onChange={(event) => setDisplayNamePassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDisplayNameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDisplayNameChange()}
                disabled={submitting !== null}
              >
                {submitting === "displayName" ? "Changing..." : "Change Display Name"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setRenameOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-store-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="rename-store-title">Rename Store</h3>
              <p>Enter a new unique store name and your password. The charge is exactly $200.00.</p>
            </div>
            <label className="modal-card__field">
              New store name
              <input
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <input
                value={renamePassword}
                onChange={(event) => setRenamePassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setRenameOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button type="button" onClick={() => void handleRename()} disabled={submitting !== null}>
                {submitting === "rename" ? "Renaming..." : "Pay $200 and rename"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {logoutOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setLogoutOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="logout-title">Confirm Logout</h3>
              <p>Enter your password to confirm logout.</p>
            </div>
            <label className="modal-card__field">
              Password
              <input
                value={logoutPassword}
                onChange={(event) => setLogoutPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setLogoutOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={submitting !== null}
              >
                {submitting === "logout" ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleteOpen(false)}>
          <div
            className="modal-card modal-card--danger"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__copy">
              <h3 id="delete-account-title">Delete Account</h3>
              <p>
                This cannot be undone. Your shop and listings will be deactivated, active carts
                will be abandoned, and you will be signed out.
              </p>
            </div>
            <label className="modal-card__field">
              Username
              <input
                value={deleteUsername}
                onChange={(event) => setDeleteUsername(event.target.value)}
                placeholder={username}
                autoComplete="username"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Password
              <input
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                disabled={submitting !== null}
              />
            </label>
            <label className="modal-card__field">
              Type DELETE
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={submitting !== null}
              />
            </label>
            {state.error ? <span className="status-text status-text--error">{state.error}</span> : null}
            <div className="modal-card__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDeleteOpen(false)}
                disabled={submitting !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void handleDeleteAccount()}
                disabled={submitting !== null}
              >
                {submitting === "delete" ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
