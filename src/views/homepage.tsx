"use client";

import { Button } from "@/components/ui/button";
import useUsername from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

export default function Homepage() {
  const { username } = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom } = useMutation({
    mutationKey: ["create-query"],
    mutationFn: async () => {
      const res = await client.api.room.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    /* Menggunakan font-mono (JetBrains Mono) secara global di halaman ini */
    <main className="flex items-center min-h-screen justify-center flex-col p-4 bg-background text-foreground font-mono">
      <div className="w-full max-w-md space-y-8">
        
        {/* Error/Status Alerts */}
        {(wasDestroyed || error) && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 text-center rounded-lg">
            <p className="text-destructive text-sm font-bold tracking-tighter">
              {wasDestroyed ? "SYSTEM: Room Destroyed" : 
               error === "room-not-found" ? "ERROR: Room not found" : 
               "ERROR: Room full"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {wasDestroyed ? "All data has been wiped from the server." :
               error === "room-not-found" ? "The requested ID does not exist." :
               "Maximum capacity reached."}
            </p>
          </div>
        )}

        <div className="text-center space-y-2">
          {/* Logo dengan warna Primary */}
          <h1 className="text-2xl font-bold tracking-tighter text-primary">
            {">"}private_chat
          </h1>
          <p className="text-muted-foreground text-sm tracking-tight">
            Encrypted, self-destructing communication.
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="border border-border bg-card p-6 rounded-xl shadow-lg">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Operator Identity
              </label>
              <div className="relative">
                {/* Visual Identity Display */}
                <div className="w-full bg-muted/30 border border-input p-4 text-sm text-primary rounded-md border-dashed">
                  <span className="opacity-50 mr-2">$</span>
                  {username}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => createRoom()}
                className="w-full bg-primary text-primary-foreground p-3 text-sm font-bold hover:opacity-90 transition-all rounded-md shadow-sm cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                INITIALIZE_SECURE_ROOM
              </button>
              
              <Button 
                variant="outline" 
                className="w-full border-border text-muted-foreground text-xs hover:bg-accent"
              >
                JOIN_VIA_ID
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-[10px] text-center text-muted-foreground/50 uppercase tracking-[0.2em]">
          End-to-End Encryption Active
        </p>
      </div>
    </main>
  );
}