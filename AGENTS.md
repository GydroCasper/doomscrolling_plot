# Local secrets policy

- Never open, read, print, search, source, parse, or otherwise inspect `.env.local` or any other local environment file that may contain secrets.
- Never access, inspect, or print the credential file referenced by `GOOGLE_APPLICATION_CREDENTIALS`, including Firebase service-account JSON files.
- Never run commands that load `.env.local` or otherwise consume the local Firebase credentials. The user must run credential-dependent commands themselves.
- Do not expose secret values or local secret-file paths in tool calls, logs, patches, summaries, or responses.
- It is safe to edit `.env.example` as long as it contains placeholders only.
