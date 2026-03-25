"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus, Save, Trash2, Shield, Check, X, Info, ChevronRight,
    Search, UserCircle, Settings, LayoutDashboard, Users, User,
    UserPlus, UserMinus, Mail, ShieldCheck, Crown, RefreshCcw,
    Zap, Lock, Globe, AlertCircle, Copy, MoreHorizontal,
    Monitor, Database, Key, Layout, FileText, Activity,
    Eye, Pencil, Download, Printer, CheckCircle2,
    Filter, ArrowRight, CheckSquare, Square
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

    const togglePermissionAction = (module: string, action: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.module === module) {
                const newActions = p.actions.includes(action)
                    ? p.actions.filter((a: string) => a !== action)
                    : [...p.actions, action];
                return { ...p, actions: newActions };
            }
            return p;
        }));
    };

    const updatePermissionScope = (module: string, scope: string) => {
        setPermissions(prev => prev.map(p => p.module === module ? { ...p, scope } : p));
    };

    const bulkUpdateAction = (action: string, enabled: boolean) => {
        setPermissions(prev => prev.map(p => {
            const newActions = enabled 
                ? Array.from(new Set([...p.actions, action]))
                : p.actions.filter((a: string) => a !== action);
            return { ...p, actions: newActions };
        }));
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
        modules: permissions.filter(p => p.actions.length > 0).length,
        actions: permissions.reduce((acc, p) => acc + p.actions.length, 0),
        users: roleUsers.length
    }), [permissions, roleUsers]);

    if (isLoading && roles.length === 0) {
        return <div className="flex h-screen items-center justify-center"><RefreshCcw className="animate-spin h-5 w-5 text-primary" /></div>;
    }

    return (
        <div className="flex h-[calc(100vh-80px)] bg-slate-50/20 overflow-hidden text-slate-900 border-t border-slate-100">
            {/* Sidebar: Role Selector (Pinned) */}
            <div className="w-64 flex flex-col h-full border-r border-slate-100 shrink-0 bg-white">
                <div className="p-4 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">System Roles</p>
                        <button onClick={() => setShowCreateDialog(true)} className="text-primary hover:text-primary/70 transition-colors">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input 
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Find..." className="pl-9 h-9 border-slate-100 rounded-lg text-xs" 
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-1 pb-10">
                        {filteredRoles.map(role => {
                            const isSelected = selectedRole?.id === role.id;
                            const Icon = isSelected ? ShieldCheck : Shield;
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                                        ${isSelected ? "bg-slate-900 text-white shadow-md shadow-slate-300" : "hover:bg-slate-100 text-slate-600"}`}
                                >
                                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-slate-300"}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase truncate tracking-wide">{role.name}</span>
                                            {role.isSystem && <Lock className="h-2.5 w-2.5 opacity-30 shrink-0" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Panel: High Density Matrix */}
            <div className="flex-1 min-w-0 h-full flex flex-col bg-white">
                {selectedRole ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden shadow-slate-200/40">
                        {/* Compact Context Header */}
                        <div className="px-6 h-16 flex items-center justify-between border-b border-slate-100 shrink-0 gap-8">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-9 w-9 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-100 shrink-0">
                                    <Key className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{roleName}</h2>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 ml-4 border-l pl-4">
                                            <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {stats.modules} Mod</span>
                                            <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {stats.actions} Prms</span>
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stats.users} Staff</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic truncate">{roleDesc || "Functional permissions profile"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="mr-8">
                                    <TabsList className="bg-slate-100/50 h-9 p-0.5 rounded-lg border border-slate-100">
                                        <TabsTrigger value="permissions" className="rounded-md px-4 h-full text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-primary">
                                            Matrix
                                        </TabsTrigger>
                                        <TabsTrigger value="users" className="rounded-md px-4 h-full text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-primary">
                                            Assignment
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                    <Switch checked={roleIsActive} onCheckedChange={setRoleIsActive} disabled={selectedRole.isSystem} className="scale-75" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{roleIsActive ? "ACTIVE" : "OFF"}</span>
                                </div>

                                <Button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                                >
                                    {isSaving ? "Syncing..." : "Sync Role"}
                                </Button>
                                
                                {!selectedRole.isSystem && (
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:text-rose-500 hover:bg-rose-50" onClick={deleteRole}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* The Matrix Body */}
                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="permissions" className="m-0 h-full overflow-hidden flex flex-col">
                                {/* Fixed Matrix Header */}
                                <div className="flex items-center h-12 bg-slate-50/50 border-b border-slate-100 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 shadow-sm">
                                    <div className="w-56">Functional Module</div>
                                    <div className="flex-1 flex items-center justify-center gap-6">
                                        {PERMISSION_ACTIONS.map(action => (
                                            <div key={action} className="w-10 text-center flex flex-col items-center group relative cursor-help">
                                                {(() => { const Icon = ACTION_ICON_MAP[action]; return <Icon className="h-3.5 w-3.5 mb-1 group-hover:text-primary transition-colors" />; })()}
                                                <span className="opacity-0 group-hover:opacity-100 absolute -bottom-4 bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] transition-all whitespace-nowrap z-50">{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-48 text-right pr-4">Matrix Scope</div>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="px-8 py-4 pb-20 space-y-8">
                                        {Object.entries(MODULE_GROUPS).map(([groupName, modules]) => (
                                            <div key={groupName} className="space-y-1">
                                                <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
                                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{groupName}</h3>
                                                    <div className="flex-1 h-[1px] bg-slate-50" />
                                                </div>
                                                
                                                <div className="space-y-0.5">
                                                    {modules.map((module) => {
                                                        const perm = permissions.find(p => p.module === module) || { actions: [], scope: "OWN" };
                                                        const ModuleIcon = MODULE_ICON_MAP[module] || LayoutDashboard;
                                                        const isActive = perm.actions.length > 0;

                                                        return (
                                                            <motion.div 
                                                                key={module}
                                                                whileHover={{ x: 4 }}
                                                                className={`flex items-center h-10 px-4 rounded-lg transition-all group
                                                                    ${isActive ? "bg-white border border-slate-100 shadow-sm" : "bg-transparent grayscale opacity-50"}`}
                                                            >
                                                                <div className="w-52 shrink-0 flex items-center gap-3">
                                                                    <div className={`h-6 w-6 rounded flex items-center justify-center border transition-colors
                                                                        ${isActive ? "bg-primary text-white border-primary" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                                                                        <ModuleIcon className="h-3 w-3" />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter truncate">
                                                                        {module.replace(/_/g, " ")}
                                                                    </span>
                                                                </div>

                                                                <div className="flex-1 flex items-center justify-center gap-6">
                                                                    {PERMISSION_ACTIONS.map(action => (
                                                                        <button
                                                                            key={action}
                                                                            onClick={() => togglePermissionAction(module, action)}
                                                                            disabled={roleName === "Super Admin"}
                                                                            className={`w-10 h-7 rounded flex items-center justify-center transition-all border
                                                                                ${perm.actions.includes(action)
                                                                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                                                                                    : "bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-600"}`}
                                                                        >
                                                                            {perm.actions.includes(action) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 opacity-50" />}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                <div className="w-48 shrink-0 flex justify-end pr-2">
                                                                    <Select 
                                                                        value={perm.scope || "OWN"} 
                                                                        onValueChange={(v) => updatePermissionScope(module, v)} 
                                                                        disabled={roleName === "Super Admin" || !isActive}
                                                                    >
                                                                        <SelectTrigger className="h-7 w-36 rounded-md bg-slate-50 border-none px-3 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors focus:ring-0">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                                            {PERMISSION_SCOPES.map(scope => (
                                                                                <SelectItem key={scope} value={scope} className="text-[9px] font-black uppercase py-2 cursor-pointer transition-colors hover:bg-primary/5">
                                                                                    {scope} RECORDS
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="users" className="m-0 h-full overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-8 pb-20">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Access Control List</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff assigned to this specific permission profile</p>
                                            </div>
                                            <Button onClick={handleOpenAssignDialog} className="rounded-xl h-11 px-8 font-black bg-slate-100 text-primary hover:bg-primary hover:text-white transition-all border-0 shadow-none">
                                                <UserPlus className="h-4 w-4 mr-2" /> Add Staff Member
                                            </Button>
                                        </div>

                                        {roleUsers.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center text-slate-200">
                                                <Users className="h-16 w-16 mb-4 opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Matrix is currently isolated</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {roleUsers.map(user => (
                                                    <motion.div 
                                                        layout
                                                        key={user.id} 
                                                        className="group p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-4 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 rounded-xl shrink-0 border-2 border-slate-50">
                                                                <AvatarImage src={user.imageUrl} className="object-cover" />
                                                                <AvatarFallback className="rounded-xl bg-slate-50 text-primary font-black text-xs">{user.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-black text-slate-800 truncate uppercase leading-none">{user.name}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold truncate mt-1">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                            <Badge variant="outline" className={`text-[8px] font-black uppercase ${user.isActive ? 'text-emerald-500 border-emerald-100' : 'text-slate-300 border-slate-100'}`}>
                                                                {user.isActive ? 'Online' : 'Offline'}
                                                            </Badge>
                                                            <button 
                                                                onClick={() => handleRemoveUser(user.id)}
                                                                className="text-rose-200 hover:text-rose-500 transition-colors p-1"
                                                            >
                                                                <UserMinus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </div>
                    </Tabs>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white space-y-6">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-200 shadow-inner">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Select Permission Set</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit or modify system access rights</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Core Creation Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="rounded-2xl max-w-sm p-8 flex flex-col gap-8 shadow-2xl border-0">
                    <DialogHeader className="flex flex-col gap-2">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Matrix</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 font-bold uppercase tracking-widest">Define a unique functional role</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formal Label</Label>
                            <Input 
                                placeholder="e.g. Finance Admin" 
                                className="h-12 bg-slate-50 border-0 rounded-xl font-bold focus-visible:ring-primary/20"
                                value={newRoleData.name}
                                onChange={e => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Context Description</Label>
                            <Input 
                                placeholder="Internal use only..." 
                                className="h-12 bg-slate-50 border-0 rounded-xl font-bold focus-visible:ring-primary/20"
                                value={newRoleData.description}
                                onChange={e => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 font-black">
                        <Button 
                            variant="ghost" className="flex-1 rounded-xl h-12 text-slate-400 uppercase text-[10px]"
                            onClick={() => setShowCreateDialog(false)}
                        >Cancel</Button>
                        <Button 
                            className="flex-1 rounded-xl h-12 bg-slate-900 hover:bg-primary shadow-xl shadow-slate-200 uppercase text-[10px] tracking-widest transition-all"
                            onClick={handleCreateRole}
                            disabled={isSaving}
                        >Create Set</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="rounded-2xl max-w-md p-0 flex flex-col h-[520px] shadow-2xl overflow-hidden border-0">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">Staff Directory</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign an active member to this role</DialogDescription>
                        </DialogHeader>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name, email or ID..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="pl-11 h-12 border-slate-100 bg-white shadow-sm rounded-xl text-xs font-bold focus-visible:ring-primary/10 transition-all font-mono"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-1.5 pb-10">
                            {allUsers
                                .filter(u => !roleUsers.some(ru => ru.id === u.id))
                                .filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                                .map(user => (
                                <button 
                                    key={user.id} 
                                    onClick={() => handleAssignUser(user.id)}
                                    disabled={isAssigning}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group border border-transparent hover:border-slate-100"
                                >
                                    <Avatar className="h-10 w-10 rounded-xl border border-white shadow-sm shrink-0">
                                        <AvatarImage src={user.imageUrl} className="object-cover" />
                                        <AvatarFallback className="rounded-xl bg-slate-100 text-primary font-black text-xs">{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate">{user.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                        <Plus className="h-4 w-4 text-primary" />
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
