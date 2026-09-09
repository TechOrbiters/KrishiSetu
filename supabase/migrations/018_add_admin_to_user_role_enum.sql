-- AI MANDI — Migration 018: Add 'ADMIN' to user_role ENUM
-- Ensures seamless compatibility with 'ADMIN' role in AdminGuard & Supabase Auth

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
