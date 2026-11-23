CREATE TABLE public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  judul text NOT NULL,
  pilar text NOT NULL,
  mulai timestamptz NOT NULL,
  selesai timestamptz NOT NULL,
  lokasi text,
  tautan text,
  catatan text,
  reminder_minutes integer NOT NULL DEFAULT 0,
  converted_entry_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda TO authenticated;
GRANT ALL ON public.agenda TO service_role;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view agenda" ON public.agenda FOR SELECT TO authenticated
  USING (owner_id = auth.uid()
    OR public.grant_role(owner_id) = 'reviewer'
    OR (public.grant_role(owner_id) = 'kontributor' AND public.grant_allows_pilar(owner_id, pilar)));
CREATE POLICY "owner inserts agenda" ON public.agenda FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner updates agenda" ON public.agenda FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner deletes agenda" ON public.agenda FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.agenda_validate()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.pilar NOT IN ('Pendidikan','Penelitian','Pengabdian','Penunjang') THEN RAISE EXCEPTION 'Pilar tidak valid'; END IF;
  IF NEW.selesai < NEW.mulai THEN RAISE EXCEPTION 'Waktu selesai harus setelah waktu mulai'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER agenda_validate BEFORE INSERT OR UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.agenda_validate();
CREATE TRIGGER t_agenda_upd BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX agenda_owner_mulai ON public.agenda (owner_id, mulai);