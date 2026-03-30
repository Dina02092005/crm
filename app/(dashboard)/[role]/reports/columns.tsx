import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnConfig } from "./ReportsTable";
import { 
    Phone, 
    Mail, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    User, 
    FileText, 
    Globe, 
    Building2,
    Shield,
    Zap,
    MessageCircle,
    Monitor
} from "lucide-react";

export const LEAD_COLUMNS: ColumnConfig[] = [
    { key: "name", label: "Lead Name", visible: true, width: 200, sortable: true, render: (v, row) => (
        <div className="flex flex-col">
            <span className="font-bold text-slate-900">{v}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {row.email}</span>
        </div>
    )},
    { key: "phone", label: "Phone", visible: true, width: 140, render: v => (
        <span className="flex items-center gap-1.5 font-medium"><Phone className="h-3 w-3 text-muted-foreground" /> {v}</span>
    )},
    { key: "source", label: "Source", visible: true, width: 120, render: v => (
        <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 border-slate-200">{v || 'Direct'}</Badge>
    )},
    { key: "status", label: "Status", visible: true, width: 130, render: v => (
        <Badge className={`text-[9px] font-black uppercase rounded-lg px-2 shadow-none border-transparent
            ${v === 'CONVERTED' ? 'bg-emerald-500 hover:bg-emerald-500' :
              v === 'NEW' ? 'bg-blue-500 hover:bg-blue-500' :
              'bg-slate-400 hover:bg-slate-400'}`}>
            {v}
        </Badge>
    )},
    { key: "country", label: "Interested Country", visible: true, width: 150, render: v => (
        <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" /> {v || '-'}</span>
    )},
    { key: "agent", label: "Agent", visible: true, width: 130 },
    { key: "counselor", label: "Counselor", visible: true, width: 130 },
    { key: "createdAt", label: "Created Date", visible: true, width: 130, sortable: true, render: v => (
        <span className="text-[10px] font-bold text-muted-foreground">{v ? format(new Date(v), "MMM d, yyyy") : "-"}</span>
    )},
];

export const STUDENT_COLUMNS: ColumnConfig[] = [
    { key: "name", label: "Student Name", visible: true, width: 200, render: (v, row) => (
        <div className="flex flex-col">
            <span className="font-bold">{v}</span>
            <span className="text-[10px] text-muted-foreground">{row.email}</span>
        </div>
    )},
    { key: "phone", label: "Phone", visible: true, width: 140 },
    { key: "status", label: "Status", visible: true, width: 130, render: v => (
        <Badge variant="secondary" className="text-[9px] font-black uppercase text-secondary-foreground">{v}</Badge>
    )},
    { key: "agent", label: "Agent", visible: true, width: 130 },
    { key: "counselor", label: "Counselor", visible: true, width: 130 },
    { key: "applicationsCount", label: "Apps", visible: true, width: 80, render: v => (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent text-[10px] font-black">{v}</Badge>
    )},
    { key: "createdAt", label: "Created", visible: true, width: 130, render: v => v ? format(new Date(v), "MMM d, yyyy") : "-" },
];

export const APPLICATION_COLUMNS: ColumnConfig[] = [
    { key: "student", label: "Student", visible: true, width: 180 },
    { key: "university", label: "University", visible: true, width: 200, render: v => (
        <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold truncate">{v}</span>
        </div>
    )},
    { key: "country", label: "Country", visible: true, width: 120 },
    { key: "course", label: "Course", visible: true, width: 180 },
    { key: "intake", label: "Intake", visible: true, width: 100, render: v => (
        <Badge variant="outline" className="text-[9px] font-black">{v}</Badge>
    )},
    { key: "status", label: "Status", visible: true, width: 130, render: v => (
        <Badge className="text-[9px] font-black uppercase">{v}</Badge>
    )},
    { key: "agent", label: "Agent", visible: false, width: 130 },
    { key: "counselor", label: "Counselor", visible: true, width: 130 },
    { key: "deadline", label: "Deadline", visible: true, width: 120, render: v => v ? format(new Date(v), "MMM d, y") : '-' },
];

export const VISA_COLUMNS: ColumnConfig[] = [
    { key: "student", label: "Student", visible: true, width: 180 },
    { key: "country", label: "Country", visible: true, width: 120 },
    { key: "visaType", label: "Type", visible: true, width: 130, render: v => (
        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{v ? v.replace(/_/g, ' ') : '-'}</span>
    )},
    { key: "status", label: "Status", visible: true, width: 150, render: v => (
        <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">{v}</Badge>
    )},
    { key: "biometrics", label: "Biometrics", visible: true, width: 100, render: v => (
        <Badge variant={v === 'DONE' ? 'default' : 'secondary'} className="text-[9px] font-black">{v}</Badge>
    )},
    { key: "medical", label: "Medical", visible: true, width: 100, render: v => (
        <Badge variant={v === 'DONE' ? 'default' : 'secondary'} className="text-[9px] font-black">{v}</Badge>
    )},
    { key: "decisionDate", label: "Decision Date", visible: true, width: 120, render: v => v ? format(new Date(v), "MMM d, y") : '-' },
];

export const PERFORMANCE_COLUMNS: ColumnConfig[] = [
    { key: "userName", label: "User Name", visible: true, width: 180, render: (v, row) => (
        <div className="flex flex-col">
            <span className="font-bold">{v}</span>
            <span className="text-[9px] uppercase font-black text-muted-foreground">{row.role}</span>
        </div>
    )},
    { key: "leadsAssigned", label: "Leads", visible: true, width: 90 },
    { key: "leadsConverted", label: "Conv.", visible: true, width: 90 },
    { key: "studentsOnboarded", label: "Students", visible: true, width: 90 },
    { key: "applicationsCreated", label: "Apps", visible: true, width: 90 },
    { key: "visasApproved", label: "Visa Ok", visible: true, width: 90 },
    { key: "conversionRate", label: "Conv %", visible: true, width: 90, render: v => (
        <span className="font-black text-emerald-500">{v}</span>
    )},
    { key: "productivityScore", label: "Score", visible: true, width: 100, render: v => (
        <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${v}%` }} />
            </div>
            <span className="font-black">{v}</span>
        </div>
    )},
];

export const ACTIVITY_COLUMNS: ColumnConfig[] = [
    { key: "user", label: "User", visible: true, width: 150 },
    { key: "type", label: "Type", visible: true, width: 100, render: v => {
        const Icon = v === 'CALL' ? Phone : v === 'EMAIL' ? Mail : v === 'WHATSAPP' ? MessageCircle : FileText;
        return (
            <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-black">{v}</span>
            </div>
        );
    }},
    { key: "lead", label: "Lead / Record", visible: true, width: 180 },
    { key: "content", label: "Activity Details", visible: true, width: 300, render: v => (
        <p className="truncate text-muted-foreground italic">"{v}"</p>
    )},
    { key: "timestamp", label: "Time", visible: true, width: 150, render: v => v ? format(new Date(v), "MMM d, h:mm a") : "-" },
];
