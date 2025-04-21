// src/components/liff/LiffInitializerAndLogger.tsx
'use client'; // Needs to run client-side for LIFF and hooks

import { useEffect } from 'react'; // Only need useEffect now
import { useUser } from '@/contexts/UserContext'; // Import the hook to access setUser
// import type { Liff } from '@line/liff';
import type { Profile } from '@liff/get-profile'; // Correct type import

// This component solely initializes LIFF, logs info, sets user context, and renders nothing.
export default function LiffInitializerAndLogger() {
    // Read LIFF ID directly from environment variable within the client component
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
    const { setUser } = useUser(); // Get the setUser function from the context

    useEffect(() => {
        // Only run initialization if liffId is present
        if (!liffId) {
            console.error('[LIFF INIT&LOG] LIFF ID (NEXT_PUBLIC_LIFF_ID) is missing in environment variables.');
            return; // Stop the effect
        }

        let isMounted = true; // Prevent state updates if component unmounts during async operations
        console.log(`[LIFF INIT&LOG] Initializing LIFF with ID: ${liffId}`);

        // Dynamically import the LIFF SDK
        import('@line/liff')
            .then(liffModule => {
                const liffInstance = liffModule.default;

                // Initialize LIFF
                liffInstance.init({ liffId })
                    .then(() => {
                        if (!isMounted) return;
                        console.log('[LIFF INIT&LOG] LIFF initialization successful.');

                        // Check login status
                        if (liffInstance.isLoggedIn()) {
                            console.log('[LIFF INIT&LOG] User is logged in via LIFF. Fetching profile...');
                            liffInstance.getProfile()
                                .then((profile: Profile) => {
                                    if (isMounted) {
                                        // Log fetched profile data
                                        console.log('-------------------------------------------');
                                        console.log('[LIFF INIT&LOG] Fetched User Profile:');
                                        console.log(`  User ID: ${profile.userId}`);
                                        console.log(`  Display Name: ${profile.displayName}`);
                                        if (profile.pictureUrl) console.log(`  Picture URL: ${profile.pictureUrl}`);
                                        if (profile.statusMessage) console.log(`  Status Message: ${profile.statusMessage}`);
                                        console.log('-------------------------------------------');

                                        // Set user data in the global context
                                        setUser({
                                            displayName: profile.displayName,
                                            userId: profile.userId,
                                        });
                                        console.log('[LIFF INIT&LOG] User context updated.');
                                    }
                                })
                                .catch(error => {
                                    console.error('[LIFF INIT&LOG] Error fetching LIFF profile:', error instanceof Error ? error.message : error);
                                })
                                .finally(() => {
                                    // Log completion regardless of success/failure
                                    console.log('[LIFF INIT&LOG] Profile fetch attempt complete.');
                                });

                        } else {
                            // User is not logged in via LIFF
                            console.log('-------------------------------------------');
                            console.log('[LIFF INIT&LOG] ไม่มีการเชื่อมต่อข้อมูล user (User is not logged in via LIFF)');
                            console.log('-------------------------------------------');
                        }
                        console.log('[LIFF INIT&LOG] Initialization sequence complete.');

                    })
                    .catch(error => {
                        // Error during liff.init()
                        console.error('[LIFF INIT&LOG] LIFF initialization error:', error instanceof Error ? error.message : error);
                    });
            })
            .catch(error => {
                // Error importing the SDK module
                console.error('[LIFF INIT&LOG] Failed to load LIFF SDK module:', error instanceof Error ? error.message : error);
            });

        // Cleanup function
        return () => {
            isMounted = false;
            console.log('[LIFF INIT&LOG] Component cleanup.');
        };
        // Dependency array: Rerun if liffId or setUser function identity changes (setUser should be stable)
    }, [liffId, setUser]);

    // This component renders nothing to the UI. Its purpose is the side effect in useEffect.
    return null;
}