// src/components/liff/LiffInitializerAndLogger.tsx
'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
// import type { Liff } from '@line/liff';
import type { Profile } from '@liff/get-profile';

const LOGIN_ATTEMPTED_KEY = 'liffLoginAttempted'; // Key for sessionStorage

export default function LiffInitializerAndLogger() {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
    const { setUser } = useUser();

    useEffect(() => {
        if (!liffId) {
            console.error('[LIFF INIT&LOG] LIFF ID (NEXT_PUBLIC_LIFF_ID) is missing.');
            return;
        }

        let isMounted = true;
        console.log(`[LIFF INIT&LOG] Initializing LIFF with ID: ${liffId}`);

        import('@line/liff')
            .then(liffModule => {
                const liffInstance = liffModule.default;
                liffInstance.init({ liffId })
                    .then(() => {
                        if (!isMounted) return;
                        console.log('[LIFF INIT&LOG] LIFF initialization successful.');

                        if (liffInstance.isLoggedIn()) {
                            // --- User is Logged In ---
                            console.log('[LIFF INIT&LOG] User is logged in via LIFF. Fetching profile...');
                            // Clear the flag if login is successful now
                            sessionStorage.removeItem(LOGIN_ATTEMPTED_KEY);

                            liffInstance.getProfile()
                                .then((profile: Profile) => {
                                    if (isMounted) {
                                        // --- vvv Log Profile Data (เหมือนเดิม) vvv ---
                                        console.log('-------------------------------------------');
                                        console.log('[LIFF INIT&LOG] Fetched User Profile:');
                                        console.log(`  User ID: ${profile.userId}`);
                                        console.log(`  Display Name: ${profile.displayName}`);
                                        if (profile.pictureUrl) console.log(`  Picture URL: ${profile.pictureUrl}`);
                                        if (profile.statusMessage) console.log(`  Status Message: ${profile.statusMessage}`);
                                        // Log the whole profile object as well for debugging
                                        console.log('  Raw Profile Object:', profile);
                                        console.log('-------------------------------------------');
                                        // ------------------------------------------------

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
                                    console.log('[LIFF INIT&LOG] Initialization complete (Logged In - Profile fetch attempt finished).');
                                });
                        } else {
                            // --- User is NOT Logged In ---
                            const loginAttempted = sessionStorage.getItem(LOGIN_ATTEMPTED_KEY);

                            if (loginAttempted) {
                                // Already tried to login and came back without logging in
                                console.log('-------------------------------------------');
                                console.log('[LIFF INIT&LOG] ไม่มีการเชื่อมต่อข้อมูล user (User is not logged in, login attempt previously failed or was cancelled)');
                                console.log('-------------------------------------------');
                            } else {
                                // First time encountering not logged in state, attempt login redirect
                                console.log('[LIFF INIT&LOG] User is not logged in. Attempting redirect to LINE Login...');
                                // Set the flag *before* redirecting
                                sessionStorage.setItem(LOGIN_ATTEMPTED_KEY, 'true');
                                // Redirect to LINE Login page
                                liffInstance.login({
                                    // Optional: Specify where to redirect back after login/cancel
                                    // redirectUri: window.location.href
                                });
                                // Note: Script execution likely stops here due to redirect.
                                // The component will re-run when the user returns.
                                return; // Explicitly return to make it clear execution stops
                            }
                        }
                    })
                    .catch(error => {
                        console.error('[LIFF INIT&LOG] LIFF initialization error:', error instanceof Error ? error.message : error);
                    });
            })
            .catch(error => {
                console.error('[LIFF INIT&LOG] Failed to load LIFF SDK module:', error instanceof Error ? error.message : error);
            });

        // Cleanup function
        return () => {
            isMounted = false;
            console.log('[LIFF INIT&LOG] Component cleanup.');
        };
    }, [liffId, setUser]);

    // This component renders nothing to the UI.
    return null;
}