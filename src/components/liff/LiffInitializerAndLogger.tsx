// src/components/liff/LiffInitializerAndLogger.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react'; // Import hooks needed
import { useUser } from '@/contexts/UserContext';
// import type { Liff } from '@line/liff';
import type { Profile } from '@liff/get-profile';

// --- Constants for Popup ---
const POPUP_DURATION = 3000; // How long the popup stays visible (ms)
const TRANSITION_DURATION_MS = 300; // CSS transition duration (ms) - for fade effect

export default function LiffInitializerAndLogger() {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
    const { setUser } = useUser();

    // --- State for Popup UI ---
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupType, setPopupType] = useState<'success' | 'info' | 'error'>('info');
    // --- vvv State controls opacity and pointer-events vvv ---
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null); // Use Ref for timer

    // --- Function to trigger showing the popup (stable with useCallback) ---
    const triggerPopup = useCallback((message: string, type: 'success' | 'info' | 'error') => {
        // Clear previous timer using Ref
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        setPopupMessage(message); // Set message content
        setPopupType(type);
        setIsPopupVisible(true); // Make it visible (starts fade-in)

        // Set a new timer to hide the popup
        hideTimerRef.current = setTimeout(() => {
            setIsPopupVisible(false); // Start fade-out
            hideTimerRef.current = null; // Clear ref after timer fires
            // Optional: Clear message after fade out completes for state cleanup
            // setTimeout(() => setPopupMessage(null), TRANSITION_DURATION_MS);
        }, POPUP_DURATION);
    }, []); // Empty dependency array makes this function stable

    // --- useEffect for LIFF Initialization ---
    useEffect(() => {
        // Ensure popup starts hidden if effect re-runs
        // setIsPopupVisible(false); // Can cause flicker if uncommented

        if (!liffId) {
            console.error('[LIFF POPUP] LIFF ID is missing.');
            triggerPopup("ข้อผิดพลาด: ไม่พบ LIFF ID", "error");
            return;
        }

        let isMounted = true;
        console.log(`[LIFF POPUP] Initializing LIFF with ID: ${liffId}`);

        import('@line/liff')
            .then(liffModule => {
                const liffInstance = liffModule.default;
                liffInstance.init({ liffId })
                    .then(() => {
                        if (!isMounted) return;
                        console.log('[LIFF POPUP] LIFF initialization successful.');

                        if (liffInstance.isLoggedIn()) {
                            console.log('[LIFF POPUP] User is logged in. Fetching profile...');
                            liffInstance.getProfile()
                                .then((profile: Profile) => {
                                    if (isMounted) {
                                        // Log profile data
                                        console.log('-------------------------------------------');
                                        console.log('[LIFF POPUP] Fetched User Profile:');
                                        console.log(`  User ID: ${profile.userId}`);
                                        console.log(`  Display Name: ${profile.displayName}`);
                                        if (profile.pictureUrl) console.log(`  Picture URL: ${profile.pictureUrl}`);
                                        if (profile.statusMessage) console.log(`  Status Message: ${profile.statusMessage}`);
                                        console.log('  Raw Profile Object:', profile);
                                        console.log('-------------------------------------------');

                                        // Set user data
                                        setUser({
                                            displayName: profile.displayName,
                                            userId: profile.userId,
                                        });
                                        console.log('[LIFF POPUP] User context updated.');

                                        // Trigger Success Popup
                                        triggerPopup(`เชื่อมต่อสำเร็จ: ${profile.displayName}`, "success");
                                    }
                                })
                                .catch(_error => {
                                    console.error('[LIFF POPUP] Error fetching LIFF profile:', _error instanceof Error ? _error.message : _error);
                                    if (isMounted) triggerPopup("ผิดพลาด: ดึงข้อมูลโปรไฟล์ไม่ได้", "error");
                                });
                        } else {
                            console.log('[LIFF POPUP] ไม่มีการเชื่อมต่อข้อมูล user (Not logged in)');
                            if (isMounted) triggerPopup("ไม่ได้เชื่อมต่อกับ LINE", "info");
                        }
                    })
                    .catch(_error => {
                        console.error('[LIFF POPUP] LIFF initialization error:', _error instanceof Error ? _error.message : _error);
                        if (isMounted) triggerPopup("ผิดพลาด: ไม่สามารถเริ่ม LIFF ได้", "error");
                    });
            })
            .catch(_error => {
                console.error('[LIFF POPUP] Failed to load LIFF SDK module:', _error instanceof Error ? _error.message : _error);
                if (isMounted) triggerPopup("ผิดพลาด: โหลด LIFF SDK ไม่สำเร็จ", "error");
            });

        // --- Cleanup Function ---
        return () => {
            isMounted = false;
            // Clear timer using Ref on unmount/re-run
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null; // Reset ref
            }
            console.log('[LIFF POPUP] Component cleanup.');
        };
        // Dependencies: Stable triggerPopup, stable setUser, and liffId
    }, [liffId, setUser, triggerPopup]);

    // --- Styling for the Popup ---
    const getBackgroundColor = () => {
        switch (popupType) {
            case 'success': return 'bg-green-500';
            case 'info': return 'bg-blue-500';
            case 'error': return 'bg-red-600';
            default: return 'bg-gray-700';
        }
    };

    // --- vvv CSS Classes for Fade In/Out vvv ---
    const popupClasses = `
        fixed top-5 left-1/2 transform -translate-x-1/2 /* Position: Centered top */
        w-11/12 sm:w-auto max-w-md /* Width: Responsive */
        mt-0 /* Reset margin-top if using top-5 */
        px-4 py-3 rounded-md shadow-xl /* Appearance: padding, rounded corners, shadow */
        text-white text-center text-sm font-semibold /* Text styling */
        transition-opacity ease-in-out /* Apply transition ONLY to opacity */
        duration-${TRANSITION_DURATION_MS} /* Match JS constant for transition speed */
        z-[100] /* Ensure it's on top */
        ${getBackgroundColor()} /* Dynamic background color */
        ${isPopupVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} /* Control visibility and click-through */
    `;
    // ------------------------------------------

    // --- Render the Popup UI ---
    // Render the div always for the transition effect to work smoothly
    return (
        <div className={popupClasses} role="alert" aria-live="assertive">
            {/* Render message content */}
            {popupMessage}
            {/* It's often better to just render the message directly,
                the opacity transition handles the visual appearance/disappearance.
                Rendering conditionally based on isPopupVisible can sometimes cause text flicker during fade-out.
            */}
        </div>
    );
}