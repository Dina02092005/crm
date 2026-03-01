import prisma from "@/lib/prisma";
import { getMetaLeadDetails, MetaLeadData } from "@/lib/meta-api";

export async function processMetaLead(leadgenId: string) {
    console.log(`[MetaLeadProcessor] Fetching data for leadgen_id: ${leadgenId}`);

    // Fetch from Meta Graph API
    const leadData: MetaLeadData | null = await getMetaLeadDetails(leadgenId);

    if (!leadData || !leadData.field_data) {
        console.error(`[MetaLeadProcessor] Failed to process leadgen_id ${leadgenId}: No data returned`);
        return;
    }

    // Map the flexible field data array into a key-value object
    // Also extract primary fields
    let email = "";
    let phone = "";
    let firstName = "";
    let lastName = "";
    let fullName = "";

    const dataAsJson: Record<string, any> = {};

    for (const field of leadData.field_data) {
        const value = field.values[0] || "";
        dataAsJson[field.name] = value;

        const nameLower = field.name.toLowerCase();

        // Exact Meta standard names
        if (nameLower === "email") {
            email = value.toLowerCase().trim();
        } else if (nameLower === "phone_number" || nameLower === "phone") {
            phone = value.replace(/\s+/g, "");
            // Basic E164 normalization for India if no country code provided
            if (phone.length === 10 && !phone.startsWith("+")) {
                phone = `+91${phone}`;
            } else if (phone.startsWith("0") && phone.length === 11) {
                phone = `+91${phone.slice(1)}`;
            } else if (phone.startsWith("91") && phone.length === 12) {
                phone = `+${phone}`;
            }
        } else if (nameLower === "full_name") {
            fullName = value;
            const parts = value.split(" ");
            firstName = parts[0];
            lastName = parts.slice(1).join(" ");
        } else if (nameLower === "first_name") {
            firstName = value;
        } else if (nameLower === "last_name") {
            lastName = value;
        }
    }

    if (!fullName) {
        fullName = `${firstName} ${lastName}`.trim();
        if (!fullName) fullName = "Unknown Meta Lead";
    }

    console.log(`[MetaLeadProcessor] Processing ${fullName} | email: ${email} | phone: ${phone}`);

    const existingLead = await prisma.lead.findFirst({
        where: {
            OR: [
                ...(email ? [{ email: email }] : []),
                ...(phone ? [{ phone: phone }] : [])
            ]
        }
    });

    if (existingLead) {
        console.log(`[MetaLeadProcessor] Duplicate found! Appending activity to Lead ID: ${existingLead.id}`);

        // Get system/admin user to append the activity
        const systemUser = await prisma.user.findFirst({
            where: { role: "ADMIN" }
        });

        if (!systemUser) {
            console.error("[MetaLeadProcessor] No ADMIN user found to attribute the LeadActivity to.");
            return;
        }

        await prisma.leadActivity.create({
            data: {
                leadId: existingLead.id,
                userId: systemUser.id,
                type: "NOTE",
                content: `Lead submitted a new Meta Ad form on ${new Date(leadData.created_time).toLocaleString()}`,
                meta: {
                    source: "META_ADS",
                    leadgen_id: leadgenId,
                    ad_id: leadData.ad_id,
                    form_id: leadData.form_id,
                    raw_data: dataAsJson
                }
            }
        });
    } else {
        console.log(`[MetaLeadProcessor] Creating new lead`);

        await prisma.lead.create({
            data: {
                name: fullName,
                firstName: firstName || null,
                lastName: lastName || null,
                email: email || null,
                phone: phone || "No Phone",
                source: "META_ADS",
                status: "NEW",
                temperature: "COLD",
                data: {
                    meta_raw: dataAsJson,
                    leadgen_id: leadgenId,
                    ad_id: leadData.ad_id,
                    form_id: leadData.form_id,
                    created_time: leadData.created_time
                }
            }
        });
    }
}
