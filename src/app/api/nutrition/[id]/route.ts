import { NextResponse } from "next/server";
import {
  getNutritionPlan,
  updateNutritionPlanFromIntake,
} from "@/lib/nutrition/store";
import { nutritionIntakeSchema } from "@/lib/validations/nutrition";
import { createClient } from "@/lib/supabase/server";
import { parseLocale } from "@/lib/i18n/locale";
import { localeFromCookies } from "@/lib/i18n/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const plan = await getNutritionPlan(supabase, user.id, id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const raw = await request.json();
    const locale = parseLocale(raw?.locale ?? (await localeFromCookies()));
    const intake = nutritionIntakeSchema.parse(raw);
    const plan = await updateNutritionPlanFromIntake(
      supabase,
      user.id,
      id,
      intake,
      locale,
    );

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
