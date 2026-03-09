import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("[TEST-API] Started");
    try {
        const leads = await prisma.lead.findMany({ take: 5 });
        console.log("[TEST-API] Found leads:", leads.length);
        return NextResponse.json({ leads });
    } catch (error: any) {
        console.error("[TEST-API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
