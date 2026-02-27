import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("agent_config")
      .upsert(
        {
          id: "default",
          config: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("agent_config")
      .select("*")
      .eq("id", "default")
      .single();

    if (error || !data) {
      return NextResponse.json({
        id: "default",
        config: {
          empathyEnabled: true,
          allowDiscount: false,
          signature: "Team SequenceFlow",
        },
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
