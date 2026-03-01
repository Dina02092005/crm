import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processMetaLead } from "@/lib/processors/meta-lead";

export const dynamic = "force-dynamic";

// Meta verification token configured in dashboard
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

/**
 * GET Handler for Meta Webhook Verification
 * Meta will send a GET request with hub.mode, hub.challenge, and hub.verify_token
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // The token must exactly match what you configured in the Meta App Dashboard
    const expectedToken = "meta_crm_wh_s3cr3t_2026";

    // Meta expects a 200 response with ONLY the challenge string in the body
    if (mode === "subscribe" && token === expectedToken) {
        console.log("Meta Webhook Verified Successfully!");
        return new NextResponse(challenge, {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    // If tokens don't match, return 403 Forbidden
    if (token && token !== expectedToken) {
        console.error("Meta Webhook Verification failed! Tokens do not match.");
        return new NextResponse("Forbidden", { status: 403 });
    }

    return new NextResponse("Bad Request", { status: 400 });
}

/**
 * Validates the X-Hub-Signature-256 header sent by Meta
 */
function verifySignature(payload: string, signature: string | null): boolean {
    if (!APP_SECRET || !signature) return false;

    // Signature looks like: sha256=abcdef123...
    const expectedSignature = "sha256=" + crypto
        .createHmac("sha256", APP_SECRET)
        .update(payload)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * POST Handler for Meta Webhook Events
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        // Optional: verify signature if App Secret is configured
        if (APP_SECRET && signature) {
            if (!verifySignature(rawBody, signature)) {
                console.error("Meta Webhook signature invalid.");
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const body = JSON.parse(rawBody);

        // Check if this is a page event
        if (body.object === "page") {
            // Processing in background to return 200 to Meta immediately
            processMetaWebhookPayload(body).catch((e) => {
                console.error("Error processing Meta webhook payload:", e);
            });

            return new NextResponse("Event received", { status: 200 });
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }
    } catch (error) {
        console.error("Meta Webhook POST Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

async function processMetaWebhookPayload(body: any) {
    // Iterate over each entry
    for (const entry of body.entry) {
        // Iterate over changes
        const changes = entry.changes;
        for (const change of changes) {
            // We only care about leadgen events
            if (change.field === "leadgen") {
                const leadgenId = change.value.leadgen_id;
                const pageId = change.value.page_id;
                const formId = change.value.form_id;

                if (leadgenId) {
                    console.log(`Processing Meta Leadgen ID: ${leadgenId} from Page: ${pageId}`);
                    await processMetaLead(leadgenId);
                }
            }
        }
    }
}
