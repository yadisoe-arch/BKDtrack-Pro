import type { Database } from "@/integrations/supabase/types";
export type Entry = Database["public"]["Tables"]["logbook_entries"]["Row"];
export type Grant = Database["public"]["Tables"]["access_grants"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = "admin" | "kontributor" | "reviewer";
export type Workspace = { ownerId: string; name: string; role: Role; pilars: string[] };
export const ROLE_LABEL: Record<Role, string> = { admin: "Dosen Pemilik", kontributor: "Kontributor", reviewer: "Reviewer" };
export type Agenda = Database["public"]["Tables"]["agenda"]["Row"];
