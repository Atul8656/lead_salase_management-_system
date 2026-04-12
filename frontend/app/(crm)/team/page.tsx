"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    usersApi
      .assignees()
      .then(setUsers)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Team</h2>
        <p className="text-sm font-medium text-neutral-500">
          Active users available for lead assignment.
        </p>
      </div>

      {err && (
        <p className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 text-sm font-medium text-neutral-800">
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
              <th className="px-6 py-3">User ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-3 font-mono text-sm font-semibold text-neutral-900">{u.login_id}</td>
                <td className="px-6 py-3 font-semibold text-neutral-900">{u.full_name}</td>
                <td className="px-6 py-3 font-medium text-neutral-600">{u.email}</td>
                <td className="px-6 py-3 font-medium text-neutral-600">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
