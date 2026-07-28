import { NextResponse } from "next/server";
import { z } from "zod";
import {
  activateNutritionPlan,
  createNutritionPlan,
  deleteNutritionPlan,
  listNutritionPlans,
  renameNutritionPlan,
} from "@/lib/nutrition/store";
import { parsePreferences } from "@/lib/profile/preferences";
import { nutritionIntakeSchema } from "@/lib/validations/nutrition";
import { createClient } from "@/lib/supabase/server";
import { parseLocale } from "@/lib/i18n/locale";
import { localeFromCookies } from "@/lib/i18n/api-errors";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const plans = await listNutritionPlans(supabase, user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const prefs = parsePreferences(profile?.preferences);

    return NextResponse.json({
      plans: plans.map((item) => ({
        ...item,
        active: prefs.activeNutritionId
          ? prefs.activeNutritionId === item.id
          : plans[0]?.id === item.id,
      })),
      activeNutritionId: prefs.activeNutritionId ?? plans[0]?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not list plans.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const raw = await request.json();
    const locale = parseLocale(raw?.locale ?? (await localeFromCookies()));
    const body = nutritionIntakeSchema.parse(raw);
    const plan = await createNutritionPlan(supabase, user.id, body, locale);
    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  planId: z.string().uuid(),
  action: z.enum(["activate", "rename"]),
  title: z.string().trim().min(1).max(80).optional(),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = patchSchema.parse(await request.json());

    if (body.action === "activate") {
      await activateNutritionPlan(supabase, user.id, body.planId);
      return NextResponse.json({ ok: true });
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Plan name is required." },
        { status: 400 },
      );
    }

    await renameNutritionPlan(supabase, user.id, body.planId, body.title);
    return NextResponse.json({ ok: true, title: body.title.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const deleteSchema = z.object({
  planId: z.string().uuid(),
});

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = deleteSchema.parse(await request.json());
    await deleteNutritionPlan(supabase, user.id, body.planId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
