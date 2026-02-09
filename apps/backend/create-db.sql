-- Script untuk membuat database dan user
-- Jalankan ini di PgAdmin sebagai superuser (postgres)

-- Buat user warganet jika belum ada
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'warganet') THEN
    CREATE USER warganet WITH PASSWORD 'warganet_password';
  END IF;
END
$$;

-- Buat database
DROP DATABASE IF EXISTS warganet_db;
CREATE DATABASE warganet_db OWNER warganet;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE warganet_db TO warganet;
