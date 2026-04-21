"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import { Badge } from "@/components/ui/badge";

export default function FormErrorsPage() {
  const errors = useQuery(api.formErrors.listFormErrors, { limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Form Errors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Client-side failures reported from enquiry and newsletter forms.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {errors === undefined ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No form errors logged recently. Good news.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((e) => (
                <TableRow key={e._id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(e.timestamp), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="capitalize">
                    {e.property ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.formType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {e.errorType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {e.errorMessage}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
