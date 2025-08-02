"use client";

import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const supabase = createClient();
  const { theme } = useTheme();
  const router = useRouter();

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      router.push('/presentation');
      router.refresh();
    }
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">SuperSlide</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme={theme === "dark" ? "dark" : "default"}
          providers={['google', 'github']}
          redirectTo={`${location.origin}/auth/callback`}
        />
      </div>
    </div>
  );
}