'use.client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await axios.get('/api/notifications');
            return res.data as { notifications: Notification[], unreadCount: number };
        },
        refetchInterval: 30000, // Poll every 30s
    });

    const markReadMutation = useMutation({
        mutationFn: async (id?: string) => {
            await axios.patch('/api/notifications', { id, markAllRead: !id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleMarkAllRead = () => {
        markReadMutation.mutate(undefined);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification.id);
        }

        // Navigate based on type if needed
        if (notification.type === 'LEAD_ASSIGNED' || notification.type === 'LEAD_CONVERTED') {
            // Extract lead ID if present or just go to leads page (simplified for now)
            // In a real app, we'd embed the entity ID in the notification metadata
            if (notification.message.includes('Lead')) {
                router.push('/leads');
            }
        }
        setOpen(false);
    };

    const unreadCount = data?.unreadCount || 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 bg-gray-50 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 border border-gray-100 dark:bg-muted/50 dark:text-muted-foreground dark:hover:text-foreground dark:border-border">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={handleMarkAllRead}
                            disabled={markReadMutation.isPending}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : data?.notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                        <div className="divide-y">
                            {data?.notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-gray-50 cursor-pointer transition-colors dark:hover:bg-muted/50",
                                        !notification.isRead && "bg-cyan-50/50 dark:bg-cyan-900/10"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium leading-none text-foreground">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
