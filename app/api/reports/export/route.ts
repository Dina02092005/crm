import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';
import ExcelJS from 'exceljs';
import { AuditLogService } from '@/lib/auditLog';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'AGENT', 'COUNSELOR'].includes(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { role, id: userId } = session.user;
    const { searchParams } = new URL(req.url);

    // Role-based ID enforcement
    let effectiveAgentId = searchParams.get('agentId');
    let effectiveCounselorId = searchParams.get('counselorId');

    if (role === 'AGENT') {
        effectiveAgentId = userId;
    } else if (role === 'COUNSELOR') {
        effectiveCounselorId = userId;
        effectiveAgentId = null;
    }
    const formatType = searchParams.get('format') || 'xlsx';

    // Filters
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const agentId = searchParams.get('agentId');
    const counselorId = searchParams.get('counselorId');
    const source = searchParams.get('source');
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const temperature = searchParams.get('temperature');

    try {
        const where: any = {};
        if (from && to) {
            where.createdAt = {
                gte: startOfDay(parseISO(from)),
                lte: endOfDay(parseISO(to))
            };
        }
        if (source) where.source = source;
        if (country) where.interestedCountry = country;
        if (status) where.status = status;
        if (temperature) where.temperature = temperature;
        if (role === 'AGENT' || role === 'COUNSELOR') {
            const teamIds = [userId];
            if (role === 'AGENT') {
                const myCounselors = await prisma.user.findMany({
                    where: { counselorProfile: { agent: { userId } } },
                    select: { id: true }
                });
                teamIds.push(...myCounselors.map(c => c.id));
            }

            if (effectiveCounselorId && !teamIds.includes(effectiveCounselorId)) {
                return new NextResponse("Access Denied", { status: 403 });
            }

            where.assignments = {
                some: {
                    assignedTo: effectiveCounselorId || { in: teamIds }
                }
            };
        } else if (effectiveAgentId || effectiveCounselorId) {
            where.assignments = {
                some: {
                    ...(effectiveAgentId && { assignedTo: effectiveAgentId }),
                    ...(effectiveCounselorId && { assignedTo: effectiveCounselorId })
                }
            };
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignments: {
                    include: {
                        employee: { select: { name: true, role: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10000 // Limit as per request
        });

        // Audit Logging
        await AuditLogService.log({
            userId: session.user.id,
            action: 'EXPORT',
            module: 'REPORTS',
            entity: 'LeadExport',
            entityId: 'SYSTEM',
            metadata: {
                format: formatType,
                filters: { from, to, source, country, status, temperature, agentId, counselorId },
                rowCount: leads.length
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads Report');

        worksheet.columns = [
            { header: 'Lead Name', key: 'name', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Source', key: 'source', width: 15 },
            { header: 'Country', key: 'country', width: 15 },
            { header: 'Agent', key: 'agent', width: 20 },
            { header: 'Counselor', key: 'counselor', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Created Date', key: 'createdAt', width: 20 },
        ];

        leads.forEach(l => {
            worksheet.addRow({
                name: l.name,
                phone: l.phone,
                email: l.email || '-',
                source: l.source,
                country: l.interestedCountry || '-',
                agent: l.assignments.find(a => a.employee.role === 'AGENT')?.employee.name || '-',
                counselor: l.assignments.find(a => a.employee.role === 'COUNSELOR')?.employee.name || '-',
                status: l.status,
                createdAt: format(l.createdAt, 'yyyy-MM-dd HH:mm:ss')
            });
        });

        if (formatType === 'csv') {
            const buffer = await workbook.csv.writeBuffer();
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=leads_report_${format(new Date(), 'yyyy-MM-dd')}.csv`,
                },
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=leads_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
