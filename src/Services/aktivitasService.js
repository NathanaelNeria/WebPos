// src/Services/aktivitasService.js
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

const ACTIVITIES_COLLECTION = "userActivities";
const USERS_COLLECTION = "users";

const formatDateForQuery = (date) => {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
};

/* ======================================================
   GET USER ACTIVITIES
====================================================== */
export const getUserActivities = async (
  startDate,
  endDate,
  limitCount = 1000,
) => {
  try {
    console.log("📋 Fetching user activities...");
    console.log("📅 Period:", { startDate, endDate });

    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const activitiesQuery = query(
      collection(db, ACTIVITIES_COLLECTION),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );

    const activitiesSnap = await getDocs(activitiesQuery);
    console.log(`📦 Found ${activitiesSnap.size} activities`);

    const activities = activitiesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get unique users from activities
    const userIds = [
      ...new Set(activities.map((a) => a.user_id).filter(Boolean)),
    ];

    let users = [];
    if (userIds.length > 0) {
      // Firestore 'in' query limited to 10 items
      for (let i = 0; i < userIds.length; i += 10) {
        const batch = userIds.slice(i, i + 10);
        const usersQuery = query(
          collection(db, USERS_COLLECTION),
          where("__name__", "in", batch),
        );
        const usersSnap = await getDocs(usersQuery);
        users = [
          ...users,
          ...usersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        ];
      }
    }

    // Calculate stats
    const stats = {
      total: activities.length,
      byType: {},
      byUser: {},
      timeline: {},
      recent: activities.slice(0, 5).map((a) => ({
        action_details: a.action_details,
        timestamp: a.timestamp,
        action_type: a.action_type,
      })),
    };

    activities.forEach((a) => {
      // By type
      stats.byType[a.action_type] = (stats.byType[a.action_type] || 0) + 1;

      // By user
      if (a.user_id) {
        stats.byUser[a.user_id] = (stats.byUser[a.user_id] || 0) + 1;
      }

      // Timeline (per jam)
      const date = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const hour = date.getHours();
      const hourKey = `${hour}:00`;
      stats.timeline[hourKey] = (stats.timeline[hourKey] || 0) + 1;
    });

    return {
      activities,
      users,
      stats,
    };
  } catch (error) {
    console.error("Error getting user activities:", error);
    return {
      activities: [],
      users: [],
      stats: {
        total: 0,
        byType: {},
        byUser: {},
        timeline: {},
        recent: [],
      },
    };
  }
};
/* ======================================================
   GET ACTIVITY BY ID
====================================================== */
export const getActivityById = async (activityId) => {
  try {
    const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting activity by id:", error);
    return null;
  }
};

/* ======================================================
   GET ACTIVITIES BY USER
====================================================== */
export const getActivitiesByUser = async (userId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where("user_id", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting activities by user:", error);
    return [];
  }
};

/* ======================================================
   GET ACTIVITIES BY TYPE
====================================================== */
export const getActivitiesByType = async (
  tipe,
  startDate,
  endDate,
  limitCount = 100,
) => {
  try {
    const start = formatDateForQuery(startDate);
    const end = formatDateForQuery(endDate);

    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where("tipe", "==", tipe),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting activities by type:", error);
    return [];
  }
};

/* ======================================================
   GET ACTIVITY STATS
====================================================== */
export const getActivityStats = async (startDate, endDate) => {
  try {
    const { stats } = await getUserActivities(startDate, endDate, 1000);
    return stats;
  } catch (error) {
    console.error("Error getting activity stats:", error);
    return {
      total: 0,
      byType: {},
      byUser: {},
    };
  }
};
