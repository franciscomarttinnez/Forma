import { NextResponse } from "next/server";
import { z } from "zod";
import {
  activateRoutine,
  deleteRoutine,
  listUserRoutinesWithDays,
  renameRoutine,
} from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";
import { parsePreferences } from "@/lib/profile/preferences";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const routines = await listUserRoutinesWithDays(supabase, user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();
    const prefs = parsePreferences(profile?.preferences);

    return NextResponse.json({
      routines: routines.map((item) => ({
        ...item,
        active: prefs.activeRoutineId
          ? prefs.activeRoutineId === item.id
          : routines[0]?.id === item.id,
      })),
      activeRoutineId: prefs.activeRoutineId ?? routines[0]?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not list routines.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  routineId: z.string().uuid(),
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
      await activateRoutine(supabase, user.id, body.routineId);
      return NextResponse.json({ ok: true });
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Routine name is required." },
        { status: 400 },
      );
    }

    await renameRoutine(supabase, user.id, body.routineId, body.title);
    return NextResponse.json({ ok: true, title: body.title.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update the routine.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const deleteSchema = z.object({
  routineId: z.string().uuid(),
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
    await deleteRoutine(supabase, user.id, body.routineId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete the routine.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
