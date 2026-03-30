export interface StatusConfig {
    label: string;
    color: string;
    bg: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    // Shared / Default
    ALL: { label: "All", color: "text-primary", bg: "bg-primary/10" },

    // LeadStatus
    NEW: { label: "New", color: "text-blue-600", bg: "bg-blue-600/10" },
    UNDER_REVIEW: { label: "Under Review", color: "text-purple-600", bg: "bg-purple-600/10" },
    CONTACTED: { label: "Contacted", color: "text-amber-600", bg: "bg-amber-600/10" },
    COUNSELLING_SCHEDULED: { label: "Couns. Scheduled", color: "text-indigo-600", bg: "bg-indigo-600/10" },
    COUNSELLING_COMPLETED: { label: "Couns. Completed", color: "text-emerald-600", bg: "bg-emerald-600/10" },
    FOLLOWUP_REQUIRED: { label: "Follow-up Req.", color: "text-rose-600", bg: "bg-rose-600/10" },
    INTERESTED: { label: "Interested", color: "text-green-600", bg: "bg-green-600/10" },
    NOT_INTERESTED: { label: "Not Interested", color: "text-slate-600", bg: "bg-slate-600/10" },
    ON_HOLD: { label: "On Hold", color: "text-orange-600", bg: "bg-orange-600/10" },
    CLOSED: { label: "Closed", color: "text-gray-600", bg: "bg-gray-600/10" },
    CONVERTED: { label: "Converted", color: "text-cyan-600", bg: "bg-cyan-600/10" },

    // StudentStatus (Additions)
    DOCUMENT_PENDING: { label: "Doc Pending", color: "text-amber-600", bg: "bg-amber-600/10" },
    DOCUMENT_VERIFIED: { label: "Doc Verified", color: "text-emerald-600", bg: "bg-emerald-600/10" },
    NOT_ELIGIBLE: { label: "Not Eligible", color: "text-red-600", bg: "bg-red-600/10" },
    APPLICATION_SUBMITTED: { label: "Appl. Submitted", color: "text-indigo-600", bg: "bg-indigo-600/10" },

    // ApplicationStatus (Additions)
    PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-600/10" },
    SUBMITTED: { label: "Submitted", color: "text-blue-600", bg: "bg-blue-600/10" },
    APPLIED: { label: "Applied", color: "text-indigo-600", bg: "bg-indigo-600/10" },
    FINALIZED: { label: "Finalized", color: "text-emerald-600", bg: "bg-emerald-600/10" },
    OFFER_RECEIVED: { label: "Offer Received", color: "text-green-600", bg: "bg-green-600/10" },
    READY_FOR_VISA: { label: "Ready for Visa", color: "text-orange-600", bg: "bg-orange-600/10" },
    VISA_PROCESS: { label: "Visa Process", color: "text-sky-600", bg: "bg-sky-600/10" },
    ENROLLED: { label: "Enrolled", color: "text-cyan-600", bg: "bg-cyan-600/10" },
    DEFERRED: { label: "Deferred", color: "text-pink-600", bg: "bg-pink-600/10" },
    REJECTED: { label: "Rejected", color: "text-rose-600", bg: "bg-rose-600/10" },
    WITHDRAWN: { label: "Withdrawn", color: "text-slate-600", bg: "bg-slate-600/10" },

    // VisaStatus (Additions)
    VISA_GUIDANCE_GIVEN: { label: "Guidance Given", color: "text-blue-600", bg: "bg-blue-600/10" },
    DOCUMENTS_CHECKLIST_SHARED: { label: "Checklist Shared", color: "text-indigo-600", bg: "bg-indigo-600/10" },
    DOCUMENTS_PENDING: { label: "Docs Pending", color: "text-amber-600", bg: "bg-amber-600/10" },
    DOCUMENTS_RECEIVED: { label: "Docs Received", color: "text-emerald-600", bg: "bg-emerald-600/10" },
    DOCUMENTS_VERIFIED: { label: "Docs Verified", color: "text-green-600", bg: "bg-green-600/10" },
    FINANCIAL_DOCUMENTS_PENDING: { label: "Financials Pend.", color: "text-orange-600", bg: "bg-orange-600/10" },
    SPONSORSHIP_DOCUMENTS_PENDING: { label: "Sponsorship Pend.", color: "text-orange-500", bg: "bg-orange-500/10" },
    VISA_APPLICATION_IN_PROGRESS: { label: "In Progress", color: "text-sky-600", bg: "bg-sky-600/10" },
    VISA_APPLICATION_SUBMITTED: { label: "Submitted", color: "text-blue-700", bg: "bg-blue-700/10" },
    BIOMETRICS_SCHEDULED: { label: "Biometrics Sch.", color: "text-violet-600", bg: "bg-violet-600/10" },
    BIOMETRICS_COMPLETED: { label: "Biometrics Comp.", color: "text-violet-700", bg: "bg-violet-700/10" },
    ADDITIONAL_DOCUMENTS_REQUESTED: { label: "Addon Docs Req.", color: "text-rose-500", bg: "bg-rose-500/10" },
    INTERVIEW_SCHEDULED: { label: "Interview Sch.", color: "text-fuchsia-600", bg: "bg-fuchsia-600/10" },
    INTERVIEW_COMPLETED: { label: "Interview Comp.", color: "text-fuchsia-700", bg: "bg-fuchsia-700/10" },
    VISA_APPROVED: { label: "Visa Approved", color: "text-emerald-600", bg: "bg-emerald-600/10" },
    VISA_GRANTED: { label: "Visa Granted", color: "text-green-600", bg: "bg-green-600/10" },
    VISA_REFUSED: { label: "Visa Refused", color: "text-red-600", bg: "bg-red-600/10" },
    VISA_REJECTED: { label: "Visa Rejected", color: "text-rose-700", bg: "bg-rose-700/10" },
    VISA_WITHDRAWN: { label: "Visa Withdrawn", color: "text-slate-600", bg: "bg-slate-600/10" },
};

export function formatEnumLabel(status: string): string {
    if (STATUS_CONFIG[status]) return STATUS_CONFIG[status].label;
    
    // Fallback: Convert ENUM_VALUE to Enum Value
    return status
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0) + word.slice(1))
        .join(' ');
}
