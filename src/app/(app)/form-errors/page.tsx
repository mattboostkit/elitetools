"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";

export default function FormErrorsPage() {
  const errors = useQuery(api.formErrors.listFormErrors, { limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Form Errors</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Client-side failures reported from enquiry and newsletter forms.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        {errors === undefined ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No form errors logged recently. Good news.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr
                  key={e._id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(e.timestamp), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 capitalize">
                    {e.property ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{e.formType}</td>
                  <td className="px-4 py-3 text-zinc-600 capitalize">
                    {e.errorType}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 max-w-md truncate">
                    {e.errorMessage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
