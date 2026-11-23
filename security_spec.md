# Security Specification — Salão Boa Vista

## 1. Data Invariants
1. **Direct Access Mode**: As requested by the user, adding/editing reservations, blocking dates, and editing venue descriptions do not require login, while all writes remain strictly constrained by schema validation, field limits, regex patterns, and atomic batch consistency.
2. **Atomic Sync**: Creating or updating `/reservations/{dateId}` must atomically write the corresponding `/availability/{dateId}` document in the same batch (`getAfter()`), preventing out-of-sync calendar states.
3. **Path Hardening & Bounded Fields**: Every `dateId` must strictly match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, and every string field has strict `.size()` bounds matching `firebase-blueprint.json`.
4. **Temporal & Structural Integrity**: `createdAt`/`updatedAt` must equal `request.time`; `createdAt` and `ownerUid` are immutable on update; shadow/ghost fields are rejected via `hasOnly()`.
