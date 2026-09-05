# KRISHISETU / AI MANDI — ARCHITECTURAL RESPONSIBILITY MATRIX

This document defines the strict, non-overlapping responsibility boundaries across all system components.

---

## Service Responsibility Matrix

| Capability / Domain | Owning System | Secondary System | Excluded Systems | Rationale |
|---|---|---|---|---|
| **User Identity & Phone Auth** | Firebase Authentication | Supabase `users` table bridge | Supabase Auth, Custom JWT | Firebase Phone OTP provides seamless mobile auth; Firebase UID is mapped to Supabase. |
| **Business Data & State Truth** | Supabase PostgreSQL | Next.js API Routes | Firebase RTDB, Client LocalStorage | Relational integrity, FK constraints, transactions, and audit logs live in PostgreSQL. |
| **Application File Storage** | Supabase Storage | Next.js API Upload Route | Firebase Storage | Single storage provider for produce photos, avatars, and official documents. |
| **Realtime Transit Location** | Firebase RTDB | Browser Geolocation API | PostgreSQL | High-frequency GPS updates (every 5-10s) belong in RTDB to avoid DB write saturation. |
| **Push Notifications** | Firebase FCM | Next.js Notification Service | Web Push Native | FCM handles cross-platform background push notifications for Android, iOS, and Web PWA. |
| **Visual Produce Assistance** | Google Cloud Vision API | Supabase Storage | LLM Vision | Fast, structured image annotation for crop, quality, and damage cues. *Non-authoritative*. |
| **Interactive Maps & Routing** | Google Maps Platform | Next.js Location API | Haversine (Fallback only) | Maps JS renders interactive routes; Directions API calculates precise road ETAs. |
| **Device Position Acquisition** | Browser Geolocation API | Google Geolocation API (Server) | Manual Address Entry (Fallback) | Permission-based native client position retrieval with zero API cost. |
| **Indic Voice & Translation** | Sarvam AI Suite | Next.js AI Orchestrator | Google Translate, OpenAI | Native Indian language STT (Saaras), TTS (Bulbul), Translation (Mayura), Transliteration. |
| **Business Logic & Rules** | Next.js API Routes | Domain Services | Frontend UI, LLM Assistant | Financial math, FreshRoute deadlines, and inventory reservations are strictly enforced server-side. |
| **Conversational Assistant** | Krishi AI Assistant (Sarvam) | Next.js Domain Tools | Frontend Client Logic | Natural language parsing proposes drafts; domain services validate and execute upon user approval. |

---

## Non-Overlapping Principles
1. **Firebase NEVER stores business transaction data** (no Firestore used).
2. **Supabase NEVER handles phone OTP authentication** (uses Firebase UID mapping).
3. **AI models NEVER directly modify database records** without domain service validation and user confirmation.
4. **Frontend NEVER calculates authoritative revenue or fees** (server-side `pricing.ts` is the single source of truth).
