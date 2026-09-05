# Sarvam AI Setup Guide — AI MANDI

## Purpose
Sarvam AI powers Indic language speech, translation, and conversational intelligence for AI MANDI. It enables voice-first interaction for rural Indian farmers across regional languages and code-mixed dialects.

---

## Architecture & Security Classification
- **Classification**: SERVER ONLY (`SARVAM_API_KEY`)
- **Client Exposure**: NEVER place `SARVAM_API_KEY` in `NEXT_PUBLIC_` variables or browser JavaScript.
- **Header**: All server API requests pass `api-subscription-key: SARVAM_API_KEY`.

---

## Services & Models
| Capability | Model | Endpoint | Description |
|---|---|---|---|
| **Speech-to-Text** | `saaras:v1` | `/speech-to-text` | Converts farmer voice audio into Hindi/Regional transcript and extracts domain entities (e.g., crop, quantity). |
| **Text-to-Speech** | `bulbul:v1` | `/text-to-speech` | Synthesizes spoken regional Indic audio for farmer playback. |
| **Translation** | `mayura:v1` | `/translate` | Dynamic translation of user inputs and market responses across Indic languages. |
| **Language ID** | Default | `/text-language-detection` | Detects spoken/written language script. |
| **Transliteration** | Default | `/transliterate` | Normalizes Roman Hindi queries into Devanagari script for search. |
| **Krishi Assistant** | Orchestrated | `/api/ai/krishi-assistant` | AI Assistant connected to domain tools with draft confirmation guardrails. |

---

## Security & Domain Guardrails
> [!IMPORTANT]
> The AI model cannot directly alter payment amounts, bypass FreshRoute, change order statuses without domain validation, or access unauthorized user data. All mutations create a draft requiring explicit farmer confirmation.

---

## Environment Variables
Add to `.env.local`:
```env
# SARVAM AI — SERVER ONLY
SARVAM_API_KEY=sk_rsyrmj5p... (Keep secret)
```

---

## Verification
Run tests:
```bash
npm run test:thirdparty
```
