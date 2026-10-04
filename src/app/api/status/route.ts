import { primarySlots } from "@/lib/ai/router";

export async function GET() {
  const slots = primarySlots();
  return Response.json({
    ai: slots.length > 0,
    models: slots.map((s) => ({ provider: s.provider, id: s.id, trainsOnFreeTier: s.trainsOnFreeTier })),
    guard: !!process.env.GROQ_API_KEY,
  });
}
