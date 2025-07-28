'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AdminNavbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="w-full bg-white text-white backdrop-blur-sm px-6 py-4 flex justify-end rounded-b-xl shadow-md">
        <Button
            onClick={handleLogout}
            className="bg-gradient-to-r from-gray-700 to-gray-600/90 text-white hover:from-black/90 hover:to-black/80 font-semibold transition-all"
        >
            <LogOut size={22} className="mr-4" /> Logout
        </Button>
        </div>
    );
}
