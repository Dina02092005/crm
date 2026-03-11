"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search, Loader2, StickyNote, MoreVertical, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newNote, setNewNote] = useState({ title: "", content: "" });
    const [editNote, setEditNote] = useState({ title: "", content: "" });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await axios.get("/api/notes");
            setNotes(res.data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.content.trim()) {
            toast.error("Content is required");
            return;
        }

        try {
            const res = await axios.post("/api/notes", newNote);
            setNotes([res.data, ...notes]);
            setNewNote({ title: "", content: "" });
            setIsAdding(false);
            toast.success("Note added");
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    const handleUpdateNote = async (id: string) => {
        if (!editNote.content.trim()) {
            toast.error("Content is required");
            return;
        }

        try {
            const res = await axios.patch(`/api/notes/${id}`, editNote);
            setNotes(notes.map((n) => (n.id === id ? res.data : n)));
            setEditingId(null);
            toast.success("Note updated");
        } catch (error) {
            toast.error("Failed to update note");
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            await axios.delete(`/api/notes/${id}`);
            setNotes(notes.filter((n) => n.id !== id));
            toast.success("Note deleted");
        } catch (error) {
            toast.error("Failed to delete note");
        }
    };

    const filteredNotes = notes.filter(
        (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <StickyNote className="h-6 w-6 text-primary" /> My Notes
                    </h1>
                    <p className="text-sm text-muted-foreground">Keep track of your thoughts and important information</p>
                </div>
                <Button
                    onClick={() => setIsAdding(true)}
                    className="bg-primary hover:bg-primary/90 h-10 rounded-xl px-5 shadow-lg shadow-primary/20"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Note
                </Button>
            </div>

            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-border/60 bg-white shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {isAdding && (
                <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="pb-2">
                        <Input
                            placeholder="Note Title (Optional)"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                            className="text-lg font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/50"
                        />
                    </CardHeader>
                    <CardContent className="pb-2">
                        <Textarea
                            placeholder="Take a note..."
                            value={newNote.content}
                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                            className="min-h-[120px] border-none bg-transparent focus-visible:ring-0 px-0 resize-none text-sm leading-relaxed"
                            autoFocus
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-0 pb-4">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-lg h-9">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddNote} className="rounded-lg h-9 px-6 font-semibold">
                            Save Note
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                    <p className="text-muted-foreground mt-4 text-xs font-medium uppercase tracking-widest">Loading your notes...</p>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-border/40 bg-muted/10">
                    <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                        <StickyNote className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No notes found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                        {search ? "We couldn't find any notes matching your search criteria." : "Start by adding your first note to keep track of important info."}
                    </p>
                    <Button variant="outline" onClick={() => { setSearch(""); setIsAdding(true); }} className="mt-6 rounded-xl">
                        Add New Note
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNotes.map((note) => (
                        <Card key={note.id} className="group border border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl flex flex-col bg-white overflow-hidden">
                            {editingId === note.id ? (
                                <div className="p-4 flex flex-col h-full bg-primary/5">
                                    <Input
                                        value={editNote.title}
                                        onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                                        className="font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto mb-2 text-sm"
                                    />
                                    <Textarea
                                        value={editNote.content}
                                        onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                                        className="flex-1 min-h-[100px] border-none bg-transparent focus-visible:ring-0 px-0 resize-none text-xs leading-relaxed"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-primary/20">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="h-8 w-8 rounded-full text-muted-foreground">
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" onClick={() => handleUpdateNote(note.id)} className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <CardHeader className="p-5 pb-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <CardTitle className="text-sm font-bold truncate leading-tight group-hover:text-primary transition-colors">
                                                {note.title || "Untitled Note"}
                                            </CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-border/60">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingId(note.id);
                                                            setEditNote({ title: note.title, content: note.content });
                                                        }}
                                                        className="text-xs font-medium cursor-pointer rounded-lg"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Note
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="text-xs font-medium text-destructive focus:text-destructive cursor-pointer rounded-lg"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-1 flex-1">
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed whitespace-pre-wrap break-words line-clamp-[8]">
                                            {note.content}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-5 pt-0 border-t border-border/30 bg-slate-50/50">
                                        <div className="text-[10px] font-semibold text-muted-foreground/50 flex items-center gap-2 mt-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            Last updated {format(new Date(note.updatedAt), "PPP")}
                                        </div>
                                    </CardFooter>
                                </>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
