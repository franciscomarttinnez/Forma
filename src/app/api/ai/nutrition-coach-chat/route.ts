import { NextResponse } from "next/server";
import { z } from "zod";
import { parseLocale } from "@/lib/i18n/locale";
import {
  applyNutritionCoachAction,
  labelForNutritionAction,
  nutritionCoachActionSchema,
} from "@/lib/nutrition/coach";
import {
  getNutritionPlan,
  replaceNutritionPlan,
} from "@/lib/nutrition/store";
import { parsePreferences } from "@/lib/profile/preferences";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const bodySchema = z.object({
  planId: z.string().uuid(),
  action: nutritionCoachActionSchema,
  locale: z.enum(["en", "es"]).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const locale = parseLocale(body.locale);
    const current = await getNutritionPlan(supabase, user.id, body.planId);
    if (!current) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const result = applyNutritionCoachAction({
      action: body.action,
      current,
      locale,
    });

    if (result.modified && result.plan) {
      await replaceNutritionPlan(supabase, user.id, body.planId, result.plan);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const prefs = parsePreferences(profile?.preferences);

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: labelForNutritionAction(body.action, locale),
      createdAt: new Date().toISOString(),
    };
    const coachMsg = {
      id: crypto.randomUUID(),
      role: "coach" as const,
      content: result.reply,
      createdAt: new Date().toISOString(),
    };

    const nutritionCoachChat = [...prefs.nutritionCoachChat, userMsg, coachMsg].slice(
      -40,
    );

    await supabase
      .from("profiles")
      .update({
        preferences: {
          ...prefs,
          nutritionCoachChat,
        } as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      reply: result.reply,
      modified: result.modified,
      plan: result.modified ? result.plan : undefined,
      messages: [userMsg, coachMsg],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply that action.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
