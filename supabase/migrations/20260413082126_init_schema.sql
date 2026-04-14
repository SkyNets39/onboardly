-- ============================================================
-- OnBoardly — PostgreSQL Schema
-- Supabase + pgvector
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE message_role AS ENUM ('user', 'assistant');
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'failed');


-- ============================================================
-- COMPANIES
-- Multi-tenant ready. Setiap company punya data terisolasi.
-- ============================================================

CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USERS
-- Extends Supabase auth.users via foreign key.
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'employee',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);


-- ============================================================
-- DOCUMENTS
-- File yang diupload admin. Disimpan di Supabase Storage.
-- ============================================================

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER,
  status        document_status NOT NULL DEFAULT 'processing',
  error_message TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_status     ON documents(status);


-- ============================================================
-- DOCUMENT CHUNKS
-- Hasil chunking + embedding dari setiap dokumen.
-- ============================================================

CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  embedding     VECTOR(1536),
  chunk_index   INTEGER NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_company_id  ON document_chunks(company_id);

-- HNSW index untuk similarity search
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ============================================================
-- CHAT SESSIONS
-- ============================================================

CREATE TABLE chat_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id    ON chat_sessions(user_id);
CREATE INDEX idx_sessions_company_id ON chat_sessions(company_id);


-- ============================================================
-- CHAT MESSAGES
-- ============================================================

CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role        message_role NOT NULL,
  content     TEXT NOT NULL,
  sources     JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_messages_company_id ON chat_messages(company_id);
CREATE INDEX idx_messages_created_at ON chat_messages(created_at DESC);


-- ============================================================
-- SUGGESTED QUESTIONS
-- ============================================================

CREATE TABLE suggested_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggested_company_id ON suggested_questions(company_id);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggested_questions ENABLE ROW LEVEL SECURITY;

-- Helper: ambil company_id dari user yang sedang login
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: cek apakah user yang login adalah admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- companies
CREATE POLICY "users see own company"
  ON companies FOR SELECT
  USING (id = get_my_company_id());

-- users
CREATE POLICY "users see company members"
  ON users FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "users update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- documents: semua employee bisa read
CREATE POLICY "employees read documents"
  ON documents FOR SELECT
  USING (company_id = get_my_company_id());

-- documents: hanya admin yang write
CREATE POLICY "admin manage documents"
  ON documents FOR ALL
  USING (company_id = get_my_company_id() AND is_admin());

-- document_chunks: semua employee bisa read (untuk RAG)
CREATE POLICY "employees read chunks"
  ON document_chunks FOR SELECT
  USING (company_id = get_my_company_id());

-- document_chunks: hanya admin/service role yang write
CREATE POLICY "admin manage chunks"
  ON document_chunks FOR ALL
  USING (company_id = get_my_company_id() AND is_admin());

-- chat_sessions: user hanya lihat sesi sendiri
CREATE POLICY "users manage own sessions"
  ON chat_sessions FOR ALL
  USING (user_id = auth.uid());

-- chat_messages: user hanya lihat pesan dari sesi sendiri
CREATE POLICY "users manage own messages"
  ON chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- suggested_questions: semua employee bisa read
CREATE POLICY "employees read suggestions"
  ON suggested_questions FOR SELECT
  USING (company_id = get_my_company_id());

-- suggested_questions: hanya admin yang manage
CREATE POLICY "admin manage suggestions"
  ON suggested_questions FOR ALL
  USING (company_id = get_my_company_id() AND is_admin());


-- ============================================================
-- SIMILARITY SEARCH FUNCTION
-- Dipanggil dari Edge Function saat RAG query.
-- ============================================================

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding  VECTOR(1536),
  match_company_id UUID,
  match_count      INT     DEFAULT 5,
  match_threshold  FLOAT   DEFAULT 0.75
)
RETURNS TABLE (
  id          UUID,
  document_id UUID,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.company_id = match_company_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;


-- ============================================================
-- SEED DATA (development only — uncomment to use)
-- ============================================================

-- INSERT INTO companies (name, slug) VALUES ('Acme Corp', 'acme');