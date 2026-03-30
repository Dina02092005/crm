"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus, Save, Trash2, Shield, Check, X, Info, ChevronRight,
    Search, UserCircle, Settings, LayoutDashboard, Users, User,
    UserPlus, UserMinus, Mail, ShieldCheck, Crown, RefreshCcw,
    Zap, Lock, Globe, AlertCircle, Copy, MoreHorizontal,
    Monitor, Database, Key, Layout, FileText, Activity,
    Eye, Pencil, Download, Printer, CheckCircle2,
    Filter, ArrowRight, CheckSquare, Square, ChevronDown, ChevronUp,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Card, CardContent,
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSION_MODULES, PERMISSION_ACTIONS, PERMISSION_SCOPES } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";

const MODULE_GROUPS = {
    "CRM Core": ["LEADS", "STUDENTS", "APPLICATIONS", "VISA", "FOLLOW_UPS"],
    "Team & Org": ["AGENTS", "COUNSELORS", "ROLES"],
    "Resources": ["REPORTS", "MASTER", "FILE_MANAGER", "NOTES"]
};

const MODULE_ICON_MAP: Record<string, any> = {
    "LEADS": Zap,
    "STUDENTS": Users,
    "APPLICATIONS": Layout,
    "VISA": Shield,
    "AGENTS": UserCircle,
    "COUNSELORS": User,
    "REPORTS": Activity,
    "MASTER": Database,
    "FILE_MANAGER": Globe,
    "ROLES": Key,
    "NOTES": FileText,
    "FOLLOW_UPS": Monitor,
};

const ACTION_ICON_MAP: Record<string, any> = {
    "VIEW": Eye,
    "CREATE": Plus,
    "EDIT": Pencil,
    "DELETE": Trash2,
    "DOWNLOAD": Download,
    "PRINT": Printer,
    "APPROVE": CheckCircle2,
};

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("permissions");

    const [roleName, setRoleName] = useState("");
    const [roleDesc, setRoleDesc] = useState("");
    const [roleIsActive, setRoleIsActive] = useState(true);
    const [permissions, setPermissions] = useState<any[]>([]);

    const [roleUsers, setRoleUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ name: "", description: "" });
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => { fetchRoles(); }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
                if (data.length > 0 && !selectedRole) {
                    const adminRole = data.find((r: any) => r.name === "Admin") || data[0];
                    handleSelectRole(adminRole);
                }
            }
        } catch { toast.error("Failed to fetch roles"); }
        finally { setIsLoading(false); }
    };

    const handleSelectRole = async (role: any) => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`/api/roles/${role.id}`);
            if (res.ok) {
                const fullRole = await res.json();
                setSelectedRole(fullRole);
                setRoleName(fullRole.name);
                setRoleDesc(fullRole.description || "");
                setRoleIsActive(fullRole.isActive);
                setPermissions(fullRole.permissions);
                setActiveTab("permissions");
                fetchRoleUsers(fullRole.id);
            }
        } catch { toast.error("Failed to load role details"); }
        finally { setIsLoadingUsers(false); }
    };

    const fetchRoleUsers = async (roleId: string) => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`/api/roles/${roleId}/users`);
            if (res.ok) setRoleUsers(await res.json());
        } catch { } finally { setIsLoadingUsers(false); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch("/api/employees?limit=200&status=active");
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data.employees || []);
            }
        } catch { }
    };

    const handleOpenAssignDialog = () => {
        fetchAllUsers();
        setShowAssignDialog(true);
        setUserSearch("");
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedRole) return;
        setIsAssigning(true);
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                toast.success("User assigned to role");
                fetchRoleUsers(selectedRole.id);
                fetchRoles();
                setShowAssignDialog(false);
            } else {
                const e = await res.json();
                toast.error(e.error || "Failed to assign");
            }
        } catch { toast.error("Error assigning user"); }
        finally { setIsAssigning(false); }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!selectedRole) return;
        if (!confirm("Remove this user from the role?")) return;
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}/users`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                toast.success("User removed from role");
                fetchRoleUsers(selectedRole.id);
                fetchRoles();
            } else {
                const e = await res.json();
                toast.error(e.error || "Failed to remove");
            }
        } catch { toast.error("Error removing user"); }
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: roleName, description: roleDesc, isActive: roleIsActive, permissions })
            });
            if (res.ok) { toast.success("Role synced"); fetchRoles(); }
            else { toast.error("Sync failed"); }
        } catch { toast.error("Error saving"); }
        finally { setIsSaving(false); }
    };

    const handleCreateRole = async () => {
        if (!newRoleData.name) return toast.error("Name required");
        setIsSaving(true);
        try {
            const res = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRoleData)
            });
            if (res.ok) {
                const created = await res.json();
                setNewRoleData({ name: "", description: "" });
                setShowCreateDialog(false);
                fetchRoles();
                handleSelectRole(created);
                toast.success("Role created");
            } else {
                const e = await res.json();
                toast.error(e.error || "Creation failed");
            }
        } catch { toast.error("Error creating role"); }
        finally { setIsSaving(false); }
    };

    const syncPermission = async (permId: string, enabled: boolean, scope?: string) => {
        if (!selectedRole) return;
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissionId: permId, enabled, scope: scope || "ALL" })
            });
            if (!res.ok) throw new Error("Sync failed");
            return true;
        } catch {
            toast.error("Cloud sync failed");
            return false;
        }
    };

    const togglePermissionAction = async (module: string, action: string) => {
        const perm = permissions.find(p => p.module === module && p.action === action);
        if (!perm) return;

        const isEnabled = !!perm.rolePermission;
        const newEnabled = !isEnabled;

        // Optimistic update
        setPermissions(prev => prev.map(p => 
            p.id === perm.id 
                ? { ...p, rolePermission: newEnabled ? { scope: "ALL" } : null } 
                : p
        ));

        const success = await syncPermission(perm.id, newEnabled, "ALL");
        if (!success) {
            // Rollback
            setPermissions(prev => prev.map(p => p.id === perm.id ? perm : p));
        } else {
            toast.success(`${action} ${module} updated`, { icon: <Zap className="h-3 w-3" />, duration: 1000 });
        }
    };

    const updatePermissionScope = async (module: string, scope: string) => {
        // Find all active permissions for this module
        const modulePerms = permissions.filter(p => p.module === module && !!p.rolePermission);
        if (modulePerms.length === 0) return;

        // Optimistic update
        const oldPerms = [...permissions];
        setPermissions(prev => prev.map(p => 
            (p.module === module && p.rolePermission) 
                ? { ...p, rolePermission: { ...p.rolePermission, scope } } 
                : p
        ));

        // Atomic updates for all enabled actions in the module
        try {
            await Promise.all(modulePerms.map(p => syncPermission(p.id, true, scope)));
            toast.success(`${module} scope: ${scope}`, { icon: <Database className="h-3 w-3" />, duration: 1500 });
        } catch {
            setPermissions(oldPerms);
        }
    };

    const toggleModule = (module: string) => {
        setExpandedModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
    };

    const handleGrantAll = async (module: string, grant: boolean) => {
        const modulePerms = permissions.filter(p => p.module === module);
        const oldPerms = [...permissions];

        // Optimistic update
        setPermissions(prev => prev.map(p => 
            p.module === module 
                ? { ...p, rolePermission: grant ? { scope: "ALL" } : null } 
                : p
        ));

        try {
            await Promise.all(modulePerms.map(p => syncPermission(p.id, grant, "ALL")));
            toast.success(`${grant ? 'Granted' : 'Revoked'} all ${module}`, { duration: 2000 });
        } catch {
            setPermissions(oldPerms);
        }
    };

    const deleteRole = async () => {
        if (!selectedRole || selectedRole.isSystem) return;
        if (!confirm(`Delete "${selectedRole.name}"?`)) return;
        try {
            const res = await fetch(`/api/roles/${selectedRole.id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Role deleted"); setSelectedRole(null); fetchRoles(); }
            else { const e = await res.json(); toast.error(e.error || "Delete failed"); }
        } catch { toast.error("Error deleting role"); }
    };

    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    
    const stats = useMemo(() => ({
        modules: Array.from(new Set(permissions.filter(p => !!p.rolePermission).map(p => p.module))).length,
        actions: permissions.filter(p => !!p.rolePermission).length,
        users: roleUsers.length
    }), [permissions, roleUsers]);

    if (isLoading && roles.length === 0) {
        return <div className="flex h-screen items-center justify-center"><RefreshCcw className="animate-spin h-5 w-5 text-primary" /></div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50/30 overflow-hidden text-slate-900">
            {/* 1. Header Section */}
            <div className="bg-white border-b border-slate-200/60 px-6 py-4 shrink-0 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            Roles & Permissions
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Toggle granular feature access for each system role
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input 
                                value={search} 
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search modules..." 
                                className="pl-9 h-10 border-slate-200 bg-slate-50/50 rounded-xl text-xs font-medium focus-visible:ring-primary/10 transition-all" 
                            />
                        </div>
                        <Button 
                            onClick={() => setShowCreateDialog(true)} 
                            size="sm"
                            className="rounded-xl h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all border-0"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Role
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Role Switch Bar */}
            <div className="bg-white border-b border-slate-100 flex items-center px-6 py-2 shrink-0 overflow-x-auto no-scrollbar gap-1">
                {roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(role => {
                    const isSelected = selectedRole?.id === role.id;
                    return (
                        <button
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                ${isSelected 
                                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                                    : "text-slate-500 hover:bg-slate-100/80 active:scale-95"}`}
                        >
                            {isSelected ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5 opacity-50" />}
                            {role.name.toUpperCase()}
                        </button>
                    );
                })}
            </div>

            <ScrollArea className="flex-1 bg-slate-50/40">
                <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                    {selectedRole ? (
                        <div className="space-y-6">
                            {/* 3. Info Banner */}
                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Info className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-800">Changes are applied in real-time.</p>
                                    <p className="text-[11px] text-blue-600/80 font-medium">Super Admins bypass all restriction protocols and retain absolute system access.</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-2 bg-white/60 border border-blue-200/50 px-3 py-1.5 rounded-lg">
                                        <Switch 
                                            checked={roleIsActive} 
                                            onCheckedChange={setRoleIsActive} 
                                            disabled={selectedRole.isSystem} 
                                            className="scale-75 data-[state=checked]:bg-blue-600" 
                                        />
                                        <span className="text-[10px] font-bold text-blue-800 uppercase">{roleIsActive ? "ACTIVE" : "INACTIVE"}</span>
                                    </div>
                                    <Button 
                                        onClick={handleSave} 
                                        disabled={isSaving}
                                        size="sm"
                                        className="rounded-lg h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                    {!selectedRole.isSystem && (
                                        <Button 
                                            variant="ghost" size="icon" 
                                            className="h-9 w-9 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
                                            onClick={deleteRole}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* 4. Module Matrix Navigation */}
                            <div className="grid grid-cols-1 gap-6">
                                {PERMISSION_MODULES.filter(m => m.toLowerCase().includes(search.toLowerCase()) || search === "").map((module) => {
                                    const modulePermissions = permissions.filter(p => p.module === module);
                                    const enabledCount = modulePermissions.filter(p => !!p.rolePermission).length;
                                    const totalCount = PERMISSION_ACTIONS.length;
                                    const isAllEnabled = enabledCount === totalCount;
                                    
                                    // Get common scope for the module (if any)
                                    const firstEnabled = modulePermissions.find(p => !!p.rolePermission);
                                    const commonScope = firstEnabled?.rolePermission?.scope || "ALL";

                                    const ModuleIcon = MODULE_ICON_MAP[module] || LayoutDashboard;
                                    const isExpanded = expandedModules.includes(module);

                                    return (
                                        <div key={module} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300/40">
                                            {/* Card Header */}
                                            <div 
                                                className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors
                                                    ${isExpanded ? "bg-slate-50/80 border-b border-slate-100" : "hover:bg-slate-50/50"}`}
                                                onClick={() => toggleModule(module)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${enabledCount > 0 ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                                                        <ModuleIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                                                            {module.replace(/_/g, " ")}
                                                        </h3>
                                                        <p className="text-[10px] font-mono font-bold text-slate-400">{module}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black tracking-tighter ${enabledCount > 0 ? "text-primary" : "text-slate-400"}`}>
                                                                {enabledCount} / {totalCount} ENABLED
                                                            </span>
                                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-primary transition-all duration-500" 
                                                                    style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

                                                    <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/40">
                                                        <Label className="text-[9px] font-black text-slate-500 uppercase cursor-pointer">Grant All</Label>
                                                        <Switch 
                                                            checked={isAllEnabled} 
                                                            onCheckedChange={(v) => handleGrantAll(module, v)}
                                                            className="scale-75"
                                                        />
                                                    </div>

                                                    <button className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors">
                                                        {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Card Content - Collapsible */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                    >
                                                        <div className="p-6 bg-white border-t border-slate-50">
                                                            {/* Scope Selector */}
                                                            <div className="flex items-center justify-between mb-6 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 bg-white rounded flex items-center justify-center border border-slate-200 shadow-sm">
                                                                        <Database className="h-3 w-3 text-slate-400" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Access Scope</span>
                                                                </div>
                                                                <Select 
                                                                    value={commonScope} 
                                                                    onValueChange={(v) => updatePermissionScope(module, v)} 
                                                                    disabled={selectedRole.isSystem && selectedRole.name === "Super Admin"}
                                                                >
                                                                    <SelectTrigger className="h-9 w-48 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                                                                        {PERMISSION_SCOPES.map(scope => (
                                                                            <SelectItem key={scope} value={scope} className="text-[10px] font-black uppercase py-2.5 hover:bg-slate-50 transition-colors">
                                                                                {scope} RECORDS
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {/* Permissions Grid */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                                {PERMISSION_ACTIONS.map(action => {
                                                                    const p = modulePermissions.find(mp => mp.action === action);
                                                                    const isEnabled = !!p?.rolePermission;
                                                                    const ActionIcon = ACTION_ICON_MAP[action] || Shield;
                                                                    return (
                                                                        <div 
                                                                            key={action}
                                                                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4
                                                                                ${isEnabled 
                                                                                    ? "bg-white border-primary/20 shadow-sm shadow-primary/5" 
                                                                                    : "bg-slate-50/50 border-slate-100 grayscale-[0.5] opacity-80"}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors
                                                                                    ${isEnabled ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-400"}`}>
                                                                                    <ActionIcon className="h-4 w-4" />
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-xs font-bold text-slate-800 tracking-tight">{action}</span>
                                                                                    <span className="text-[9px] font-mono font-bold text-slate-400">{action}_{module}</span>
                                                                                </div>
                                                                            </div>
                                                                            <Switch 
                                                                                checked={isEnabled} 
                                                                                onCheckedChange={() => togglePermissionAction(module, action)}
                                                                                disabled={selectedRole.isSystem && selectedRole.name === "Super Admin"}
                                                                                className="scale-90"
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 5. Assignment Section (Only if needed) */}
                            <div className="pt-6 border-t border-slate-200/60 text-center">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setActiveTab(activeTab === "permissions" ? "users" : "permissions")}
                                    className="rounded-xl h-12 px-8 font-black border-slate-200 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    {activeTab === "permissions" ? "Manage Direct Assignments" : "Return to Matrix"}
                                </Button>
                            </div>

                            {activeTab === "users" && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Assignments</h3>
                                        <Button onClick={handleOpenAssignDialog} size="sm" className="rounded-lg h-9 bg-slate-900 font-bold text-[10px] uppercase tracking-widest">
                                            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign Staff
                                        </Button>
                                    </div>

                                    {roleUsers.length === 0 ? (
                                        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-300">
                                            <Users className="h-16 w-16 mb-4 opacity-10" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No staff currently assigned to this role</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {roleUsers.map(user => (
                                                <div key={user.id} className="bg-white p-4 border border-slate-200/60 rounded-2xl flex items-center justify-between hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                                                            <AvatarImage src={user.imageUrl} className="object-cover" />
                                                            <AvatarFallback className="font-bold text-xs bg-slate-50 text-slate-400">{user.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-black text-slate-800 uppercase truncate">{user.name}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 truncate">{user.email}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveUser(user.id)}
                                                        className="p-2 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded-lg transition-all"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-200">
                            <ShieldAlert className="h-20 w-20 mb-4 opacity-5" />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Select a role to visualize matrix</h3>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Modals & Dialogs (Original functionality) */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="rounded-3xl max-w-sm p-8 shadow-2xl border-0 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Plus className="h-24 w-24" />
                    </div>
                    <DialogHeader className="mb-6 relative">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Role</DialogTitle>
                        <DialogDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Define a unique permission profile
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 relative">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Role Label</Label>
                            <Input 
                                placeholder="e.g. Operation Lead" 
                                className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold focus-visible:ring-primary/10 transition-all border-0 shadow-inner"
                                value={newRoleData.name}
                                onChange={e => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Context Info</Label>
                            <Input 
                                placeholder="Core management tasks..." 
                                className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold focus-visible:ring-primary/10 transition-all border-0 shadow-inner"
                                value={newRoleData.description}
                                onChange={e => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 font-black">
                        <Button 
                            variant="ghost" 
                            className="flex-1 rounded-xl h-12 text-slate-400 uppercase text-[11px] tracking-widest hover:bg-slate-50"
                            onClick={() => setShowCreateDialog(false)}
                        >Discard</Button>
                        <Button 
                            className="flex-1 rounded-xl h-12 bg-slate-900 hover:bg-primary shadow-xl shadow-slate-200 uppercase text-[11px] tracking-widest transition-all"
                            onClick={handleCreateRole}
                            disabled={isSaving}
                        >Initialize</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="rounded-3xl max-w-md p-0 flex flex-col h-[600px] shadow-2xl overflow-hidden border-0">
                    <div className="p-8 bg-white border-b border-slate-100 flex flex-col gap-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Assign Role</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Search staff roster to apply this set</DialogDescription>
                        </DialogHeader>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name, email or staff ID..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="pl-11 h-12 border-slate-100 bg-slate-50 shadow-inner rounded-xl text-xs font-bold focus-visible:ring-primary/10 transition-all font-mono"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                        <div className="space-y-2 pb-10">
                            {allUsers
                                .filter(u => !roleUsers.some(ru => ru.id === u.id))
                                .filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                                .map(user => (
                                <button 
                                    key={user.id} 
                                    onClick={() => handleAssignUser(user.id)}
                                    disabled={isAssigning}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-primary/5 transition-all text-left group border border-slate-100 hover:border-primary/20 shadow-sm"
                                >
                                    <Avatar className="h-11 w-11 rounded-xl border-2 border-white shadow-sm shrink-0">
                                        <AvatarImage src={user.imageUrl} className="object-cover" />
                                        <AvatarFallback className="rounded-xl bg-slate-100 text-primary font-black text-xs">{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate">{user.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                                        <ArrowRight className="h-4 w-4 text-primary" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
