"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Website {
    id: string;
    name: string;
    url: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function WebsitesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newWebsiteName, setNewWebsiteName] = useState("");
    const [newWebsiteUrl, setNewWebsiteUrl] = useState("");

    const fetchWebsites = async () => {
        try {
            const res = await fetch("/api/websites");
            if (res.ok) {
                const data = await res.json();
                setWebsites(data);
            } else {
                toast.error("Failed to load websites");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            // router.push("/dashboard"); // Or handle unauthorized UI
        }
        fetchWebsites();
    }, [session]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/websites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newWebsiteName, url: newWebsiteUrl }),
            });

            if (res.ok) {
                toast.success("Website added");
                setNewWebsiteName("");
                setNewWebsiteUrl("");
                setIsModalOpen(false);
                fetchWebsites();
            } else {
                toast.error("Failed to add website");
            }
        } catch (error) {
            toast.error("Error adding website");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this website? It might be linked to existing leads.")) return;
        try {
            const res = await fetch(`/api/websites/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Website deleted");
                fetchWebsites();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
        return <div className="p-8">Unauthorized</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Master Settings: Websites</h1>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Website
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Website</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Website Name</Label>
                                <Input
                                    value={newWebsiteName}
                                    onChange={(e) => setNewWebsiteName(e.target.value)}
                                    placeholder="e.g. Website 1"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL (Optional)</Label>
                                <Input
                                    value={newWebsiteUrl}
                                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <Button type="submit" className="w-full">Create</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {websites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No websites found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            websites.map((site) => (
                                <TableRow key={site.id}>
                                    <TableCell className="font-medium">{site.name}</TableCell>
                                    <TableCell>{site.url || "-"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${site.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                            {site.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(site.id)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
