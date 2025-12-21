import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function AppLayout() {
    return (
        <SidebarProvider>
            <div className="flex min-h-svh w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                    <header className="flex h-14 items-center gap-4 border-b px-4">
                        <SidebarTrigger />
                    </header>
                    <main className="flex-1 overflow-auto p-4">
                        <Outlet />
                    </main>
                    <Button
                        size="icon"
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </SidebarProvider>
    );
}
