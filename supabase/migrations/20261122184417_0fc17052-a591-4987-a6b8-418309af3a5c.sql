CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  nidn text,
  jabatan text NOT NULL DEFAULT 'Tenaga Pengajar',
  tmt date,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_email text NOT NULL,
  role text NOT NULL,
  pilars text[] NOT NULL DEFAULT ARRAY['Pendidikan','Penelitian','Pengabdian','Penunjang'],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, member_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_grants TO authenticated;
GRANT ALL ON public.access_grants TO service_role;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.logbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  pilar text NOT NULL,
  sub_kegiatan text,
  judul text NOT NULL,
  deskripsi text,
  tanggal_mulai date,
  tanggal_selesai date,
  sks numeric(5,2) NOT NULL DEFAULT 0,
  bukti_url text,
  bukti_path text,
  status text NOT NULL DEFAULT 'Menunggu Review',
  catatan_reviewer text,
  semester text NOT NULL DEFAULT 'Ganjil',
  tahun_akademik text NOT NULL DEFAULT '2026/2027',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logbook_entries TO authenticated;
GRANT ALL ON public.logbook_entries TO service_role;
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.grant_role(_owner uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.access_grants
  WHERE owner_id = _owner AND lower(member_email) = lower(coalesce(auth.jwt()->>'email',''))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.grant_allows_pilar(_owner uuid, _pilar text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.access_grants
  WHERE owner_id = _owner AND lower(member_email) = lower(coalesce(auth.jwt()->>'email',''))
    AND _pilar = ANY(pilars))
$$;

-- profiles policies
CREATE POLICY "own or shared profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.grant_role(id) IS NOT NULL);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- grants policies
CREATE POLICY "owner manages grants" ON public.access_grants FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND role IN ('kontributor','reviewer'));
CREATE POLICY "member sees own grants" ON public.access_grants FOR SELECT TO authenticated
  USING (lower(member_email) = lower(coalesce(auth.jwt()->>'email','')));

-- logbook policies
CREATE POLICY "view logbook" ON public.logbook_entries FOR SELECT TO authenticated
  USING (owner_id = auth.uid()
    OR public.grant_role(owner_id) = 'reviewer'
    OR (public.grant_role(owner_id) = 'kontributor' AND public.grant_allows_pilar(owner_id, pilar)));
CREATE POLICY "insert logbook" ON public.logbook_entries FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (owner_id = auth.uid()
    OR (public.grant_role(owner_id) = 'kontributor' AND public.grant_allows_pilar(owner_id, pilar) AND status = 'Menunggu Review')));
CREATE POLICY "update logbook" ON public.logbook_entries FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()
    OR public.grant_role(owner_id) = 'reviewer'
    OR (public.grant_role(owner_id) = 'kontributor' AND created_by = auth.uid() AND status <> 'Disetujui' AND public.grant_allows_pilar(owner_id, pilar)))
  WITH CHECK (owner_id = auth.uid()
    OR public.grant_role(owner_id) = 'reviewer'
    OR (public.grant_role(owner_id) = 'kontributor' AND created_by = auth.uid() AND public.grant_allows_pilar(owner_id, pilar)));
CREATE POLICY "delete logbook" ON public.logbook_entries FOR DELETE TO authenticated
  USING (owner_id = auth.uid()
    OR (public.grant_role(owner_id) = 'kontributor' AND created_by = auth.uid() AND status <> 'Disetujui'));

-- enforce field rules for non-owners
CREATE OR REPLACE FUNCTION public.logbook_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  IF NEW.pilar NOT IN ('Pendidikan','Penelitian','Pengabdian','Penunjang') THEN RAISE EXCEPTION 'Pilar tidak valid'; END IF;
  IF NEW.status NOT IN ('Menunggu Review','Disetujui','Perlu Revisi') THEN RAISE EXCEPTION 'Status tidak valid'; END IF;
  IF NEW.owner_id = auth.uid() OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  r := public.grant_role(NEW.owner_id);
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'Menunggu Review'; NEW.catatan_reviewer := NULL; RETURN NEW;
  END IF;
  IF r = 'reviewer' THEN
    IF NEW.status = 'Menunggu Review' AND OLD.status <> 'Menunggu Review' THEN RAISE EXCEPTION 'Reviewer hanya dapat menyetujui atau meminta revisi'; END IF;
    IF (NEW.pilar, NEW.sub_kegiatan, NEW.judul, NEW.deskripsi, NEW.tanggal_mulai, NEW.tanggal_selesai, NEW.sks, NEW.bukti_url, NEW.bukti_path, NEW.semester, NEW.tahun_akademik, NEW.owner_id, NEW.created_by)
       IS DISTINCT FROM (OLD.pilar, OLD.sub_kegiatan, OLD.judul, OLD.deskripsi, OLD.tanggal_mulai, OLD.tanggal_selesai, OLD.sks, OLD.bukti_url, OLD.bukti_path, OLD.semester, OLD.tahun_akademik, OLD.owner_id, OLD.created_by) THEN
      RAISE EXCEPTION 'Reviewer hanya dapat mengubah status dan catatan';
    END IF;
    RETURN NEW;
  END IF;
  -- kontributor
  NEW.status := 'Menunggu Review';
  NEW.catatan_reviewer := OLD.catatan_reviewer;
  NEW.owner_id := OLD.owner_id; NEW.created_by := OLD.created_by;
  RETURN NEW;
END $$;
CREATE TRIGGER logbook_guard BEFORE INSERT OR UPDATE ON public.logbook_entries FOR EACH ROW EXECUTE FUNCTION public.logbook_guard();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_grants_upd BEFORE UPDATE ON public.access_grants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_logbook_upd BEFORE UPDATE ON public.logbook_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.logbook_guard() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- storage policies for bucket 'bukti' (path: <owner_id>/...)
CREATE POLICY "bukti read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bukti' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.grant_role(((storage.foldername(name))[1])::uuid) IS NOT NULL));
CREATE POLICY "bukti upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bukti' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.grant_role(((storage.foldername(name))[1])::uuid) = 'kontributor'));
CREATE POLICY "bukti delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bukti' AND (storage.foldername(name))[1] = auth.uid()::text);