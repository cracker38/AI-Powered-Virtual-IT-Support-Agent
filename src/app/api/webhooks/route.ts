import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-webhook-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const payloadText = await req.text();
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const serviceName = payload.source || "UNKNOWN";

    // Log the webhook request
    const log = await prisma.webhookLog.create({
      data: {
        serviceName: serviceName,
        payload: payloadText,
        status: "RECEIVED",
      }
    });

    // Mock processing logic based on the service
    if (serviceName === "JIRA") {
      // In a real app we'd process Jira issues (e.g. status updates)
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { status: "SUCCESS" }
      });
    } else {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { status: "FAILED", errorMessage: "Unsupported service" }
      });
    }

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
