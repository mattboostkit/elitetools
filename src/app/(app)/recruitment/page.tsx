"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Briefcase } from "lucide-react";

const STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"] as const;

const PROPERTY_LABEL: Record<string, string> = {
  salomons: "Salomons Estate",
  owp: "One Warwick Park",
  "bewl-water": "Bewl Water",
  "bewl-adventures": "Bewl Adventures",
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  reviewing: "bg-amber-50 text-amber-700",
  shortlisted: "bg-violet-50 text-violet-700",
  rejected: "bg-neutral-100 text-neutral-500",
  hired: "bg-emerald-50 text-emerald-700",
};

export default function RecruitmentPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const applications = useQuery(api.jobApplications.list, {});
  const updateStatus = useMutation(api.jobApplications.updateStatus);

  const filtered = useMemo(() => {
    if (!applications) return [];
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
            <Briefcase className="size-6 text-amber-500" /> Recruitment
          </h1>
          <p className="text-sm text-neutral-500">
            Job applications submitted from the careers sections across the Collection.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>CV</TableHead>
              <TableHead className="w-44">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications === undefined ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-400">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-400">
                  No applications{statusFilter !== "all" ? ` with status “${statusFilter}”` : ""} yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a._id}>
                  <TableCell>
                    <div className="font-medium text-neutral-900">{a.name}</div>
                    <div className="text-xs text-neutral-500">
                      <a href={`mailto:${a.email}`} className="hover:underline">
                        {a.email}
                      </a>
                      {a.phone ? ` · ${a.phone}` : ""}
                    </div>
                    {a.message ? (
                      <div className="mt-1 max-w-md text-xs text-neutral-500 line-clamp-2">{a.message}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">{a.role}</TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {a.property ? PROPERTY_LABEL[a.property] ?? a.property : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {a.cvUrl ? (
                      <a
                        href={a.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Download className="size-4" /> {a.cvFilename || "CV"}
                      </a>
                    ) : (
                      <span className="text-sm text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={a.status}
                      onValueChange={(value) => updateStatus({ id: a._id as Id<"jobApplications">, status: value })}
                    >
                      <SelectTrigger className={`h-8 w-40 capitalize ${STATUS_TONE[a.status] ?? ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
