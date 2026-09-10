# Model Routing Policy

Inherited from `serkandnc/ai-app-development-playbook` v1.0.0.

## Default

Use GPT-5.6 Sol for repository exploration, documentation, decomposition, ordinary implementation reasoning, status tracking and research synthesis.

Reserve GPT-6 Astra for high-consequence independent reviews when available:
- final architecture gate,
- database ownership/RLS gate,
- security review,
- first vertical-slice audit,
- suspected P0/P1 root cause,
- release/security final gate.

## Fallback

If GPT-6 Astra is unavailable, use GPT-5.6 Sol with the strongest available reasoning, label the review `FALLBACK`, record the actual model, and continue only when no unresolved P0/P1 remains. Never claim an Astra review occurred when it did not.

## Cost discipline

Do not escalate because work is long or tedious. Critical review should be focused on the artifacts relevant to the gate. Fix findings, then rerun focused verification rather than regenerating whole documents unnecessarily.
