import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useUserProfileData(authUser, authLoading) {
  const [userRecord, setUserRecord] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (authLoading || !authUser) {
      return undefined;
    }

    let isMounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      if (!db) {
        if (isMounted) {
          setProfileError("Firestore is not configured yet.");
          setProfileLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", authUser.uid));

        if (!isMounted) {
          return;
        }

        setUserRecord(snapshot.exists() ? snapshot.data() : null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setProfileError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your profile.",
        );
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authUser]);

  const onboarding = userRecord?.onboardingProfile || null;
  const dailyTrackingMap = userRecord?.dailyTracking || {};

  const latestTrackingDate = useMemo(() => {
    const dates = Object.keys(dailyTrackingMap);
    if (dates.length === 0) {
      return "";
    }

    return dates.sort().at(-1) || "";
  }, [dailyTrackingMap]);

  const latestTracking = latestTrackingDate
    ? dailyTrackingMap[latestTrackingDate]
    : null;

  const preferredName =
    onboarding?.preferredName || authUser?.displayName || "there";
  const profileReady = Boolean(userRecord?.profileComplete && onboarding);

  return {
    userRecord,
    profileLoading,
    profileError,
    onboarding,
    latestTrackingMap: dailyTrackingMap,
    latestTrackingDate,
    latestTracking,
    preferredName,
    profileReady,
  };
}
