import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message, email } = await req.json();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DeliVid Feedback <onboarding@resend.dev>",
        to: "delivid01@yahoo.com",
        subject: "New DeliVid Feedback",
        text: `From: ${email || "anonymous"}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
