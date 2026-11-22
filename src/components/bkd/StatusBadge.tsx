import { Badge } from "@/components/ui/badge";
export function StatusBadge({ status }: { status: string }) {
  const v = status === "Disetujui" ? "default" : status === "Perlu Revisi" ? "destructive" : "secondary";
  return <Badge variant={v}>{status}</Badge>;
}
