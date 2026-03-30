"use client";

import { useState } from "react";
import { sendInvitation, revokeInvitation } from "@/actions/invite";
import { changeRole, removeMember } from "@/actions/members";
import Image from "next/image";
import { ROLE_HIERARCHY, VALID_ROLES } from "@/lib/roles";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};

type Props = {
  workspaceId: string;
  canInvite: boolean;
  currentUserId: string;
  currentUserRole: string;
  members: Member[];
  invitations: Invitation[];
};

export function TeamSettingsClient({
  workspaceId,
  canInvite,
  currentUserId,
  currentUserRole,
  members: initialMembers,
  invitations: initialInvitations,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [members, setMembers] = useState(initialMembers);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const canManageRoles =
    ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY] >=
    ROLE_HIERARCHY["admin"];

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleInvite(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const result = await sendInvitation(email, workspaceId, role);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(
        result.resent
          ? `Invitation resent to ${email}`
          : `Invitation sent to ${email}`,
        "success",
      );
      setEmail("");
    }
    setLoading(false);
  }

  async function handleRevoke(invitationId: string, inviteeEmail: string) {
    const result = await revokeInvitation(invitationId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      showToast(`Invitation for ${inviteeEmail} revoked.`, "success");
    }
  }

  async function handleChangeRole(member: Member, newRole: string) {
    const result = await changeRole(member.id, newRole, workspaceId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)),
      );
      showToast(`${member.name}'s role updated to ${newRole}.`, "success");
    }
  }

  async function handleRemoveConfirmed() {
    if (!confirmRemove) return;
    const result = await removeMember(confirmRemove.id, workspaceId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== confirmRemove.id));
      showToast(`${confirmRemove.name} has been removed.`, "success");
    }
    setConfirmRemove(null);
  }

  return (
    <div className="mt-8 space-y-10">
      {/* ── Invite Form ── */}
      {canInvite && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Invite a team member
          </h2>
          <form
            onSubmit={handleInvite}
            className="flex gap-3 items-end flex-wrap"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="border border-input rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "member" | "viewer")}
                className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </form>
        </section>
      )}

      {/* ── Current Members ── */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Team members ({members.length})
        </h2>
        <div className="border border-border rounded-lg overflow-hidden">
          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            const callerLevel =
              ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY] ??
              0;
            const targetLevel =
              ROLE_HIERARCHY[member.role as keyof typeof ROLE_HIERARCHY] ?? 0;
            // You can only manage someone at a lower level than you
            const canManageThisMember =
              canManageRoles && callerLevel > targetLevel;
            console.log(
              "Managing member",
              member.name,
              "Caller level:",
              callerLevel,
              "Target level:",
              targetLevel,
              "Can manage?",
              canManageThisMember,
            );

            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
                      {member.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.name} {isSelf && "(you)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Role control + remove */}
                <div className="flex items-center gap-3">
                  {canManageThisMember ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member, e.target.value)}
                      className="border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {VALID_ROLES.filter(
                        (r) => ROLE_HIERARCHY[r] < callerLevel,
                      ).map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {canManageThisMember && (
                    <button
                      onClick={() => setConfirmRemove(member)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pending Invitations ── */}
      {invitations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Pending invitations ({invitations.length})
          </h2>
          <div className="border border-border rounded-lg overflow-hidden">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {inv.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={inv.role} />
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                  {canInvite && (
                    <button
                      onClick={() => handleRevoke(inv.id, inv.email)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Confirm Remove Dialog ── */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Remove member?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will remove{" "}
              <span className="font-medium">{confirmRemove.name}</span> from the
              workspace. They will lose access immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm rounded-md border border-input hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirmed}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-700",
    viewer: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
        styles[role] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {role}
    </span>
  );
}
