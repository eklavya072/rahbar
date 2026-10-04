import { CHANGELOG, CORS, registry, RULES_VERSION } from "@/lib/api/v1";

export function GET() {
  return Response.json({ rulesVersion: RULES_VERSION, rules: registry(), changelog: CHANGELOG }, { headers: { ...CORS, "cache-control": "public, max-age=3600" } });
}
