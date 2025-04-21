// src/components/liff/LiffInitializerAndLogger.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react'; // <<< เพิ่ม useCallback และ useRef
import { useUser } from '@/contexts/UserContext';
import type { Liff } from '@line/liff';
import type { Profile } from '@liff/get-profile';

// --- Constants for Popup ---
const POPUP_DURATION = 3000; // How long the popup stays visible (ms)
const TRANSITION_DURATION_MS = 300; // CSS transition duration (ms) - for fade effect

export default function LiffInitializerAndLogger() {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
    const { setUser } = useUser(); // setUser is stable from context usually

    // --- State for Popup UI ---
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupType, setPopupType] = useState<'success' | 'info' | 'error'>('info');
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false); // Controls opacity and pointer-events

    // --- vvv Use useRef for the timer ID vvv ---
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Function to trigger showing the popup (made stable with useCallback) ---
    const triggerPopup = useCallback((message: string, type: 'success' | 'info' | 'error') => {
        // Clear previous timer using Ref
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        setPopupMessage(message); // Set message content
        setPopupType(type);
        setIsPopupVisible(true); // Make it visible (starts fade-in)

        // Set a new timer and store ID in Ref
        hideTimerRef.current = setTimeout(() => {
            setIsPopupVisible(false); // Start fade-out
            hideTimerRef.current = null; // Clear ref after timer fires
            // Optional: Clear message after fade out completes
            // setTimeout(() => setPopupMessage(null), TRANSITION_DURATION_MS);
        }, POPUP_DURATION);
    }, []); // <<< Empty dependency array: This function's identity is stable

    // --- useEffect for LIFF Initialization ---
    useEffect(() => {
        // Don't need to reset popup visibility here, triggerPopup handles it

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
                                        console.log(/* ... log profile ... */);
                                        // Use the stable setUser from context
                                        setUser({
                                            displayName: profile.displayName,
                                            userId: profile.userId,
                                        });
                                        console.log('[LIFF POPUP] User context updated.');
                                        // Use the stable triggerPopup
                                        triggerPopup(`เชื่อมต่อสำเร็จ: ${profile.displayName}`, "success");
                                    }
                                })
                                .catch(error => {
                                    console.error('[LIFF POPUP] Error fetching profile:', /*...*/);
                                    if (isMounted) triggerPopup("ผิดพลาด: ดึงข้อมูลโปรไฟล์ไม่ได้", "error");
                                });
                        } else {
                            console.log('[LIFF POPUP] ไม่มีการเชื่อมต่อข้อมูล user (Not logged in)');
                            if (isMounted) triggerPopup("ไม่ได้เชื่อมต่อกับ LINE", "info");
                        }
                    })
                    .catch(error => {
                        console.error('[LIFF POPUP] LIFF initialization error:', /*...*/);
                        if (isMounted) triggerPopup("ผิดพลาด: ไม่สามารถเริ่ม LIFF ได้", "error");
                    });
            })
            .catch(error => {
                console.error('[LIFF POPUP] Failed to load LIFF SDK module:', /*...*/);
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
        // --- vvv Dependency Array: triggerPopup is stable, setUser should be stable vvv ---
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

    const popupClasses = `
        fixed top-5 left-1/2 transform -translate-x-1/2 /* Position */
        w-11/12 sm:w-auto max-w-md /* Width */
        px-4 py-3 rounded-md shadow-xl /* Appearance */
        text-white text-center text-sm font-semibold /* Text */
        transition-opacity ease-in-out /* Apply transition to opacity */
        duration-${TRANSITION_DURATION_MS} /* Match JS constant */
        z-[100] /* Ensure it's on top */
        ${getBackgroundColor()} /* Dynamic background */
        ${isPopupVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} /* Control visibility and click-through */
    `;
    // ---------------------------------------------------

    // --- Render the Popup UI ---
    return (
        <div className={popupClasses} role="alert" aria-live="assertive">
            {/* Render message only when it's supposed to be visible */}
            {isPopupVisible ? popupMessage : ''}
        </div>
    );
}