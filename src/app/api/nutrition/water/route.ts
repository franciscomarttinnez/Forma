import { NextResponse } from "next/server";
import { z } from "zod";
import { addWaterIntake } from "@/lib/nutrition/store";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  amountMl: z.number().int().min(-1000).max(1000),
  planId: z.string().uuid().optional(),
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

    const body = bodySchema.parse(await request.json());
    const plan = await addWaterIntake(
      supabase,
      user.id,
      body.amountMl,
      body.planId,
    );

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not log water.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
