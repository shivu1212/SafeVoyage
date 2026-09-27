/**
 * SafeVoyage Default Demo Data Snapshot
 */

export const INITIAL_DEMO_USER = {
  id: "usr_101",
  name: "Rahul Sharma",
  email: "demo@safevoyage.com",
  phone: "+91 98765 43210",
  alternatePhone: "+91 98765 00000",
  avatar: "",
  role: "Head Traveller",
  notificationPreferences: {
    safetyAlerts: true,
    smsAlerts: true,
    weatherAlerts: true,
    itineraryAlerts: true,
    familyAlerts: true,
    emergencyAlerts: true
  }
};

export const INITIAL_DEMO_TRIP = {
  id: "trip_chennai_01",
  title: "Chennai Coastal & Heritage Getaway",
  origin: "Bangalore",
  destination: "Chennai",
  startDate: "2026-09-24",
  endDate: "2026-09-27",
  travelType: "Flight",
  travellersCount: 4,
  notes: "Family safety trip with itinerary monitoring active.",
  status: "Active"
};

export const INITIAL_DEMO_TRAVELLERS = [
  {
    id: "trav_1",
    name: "Rahul Sharma",
    age: 32,
    phone: "+91 98765 43210",
    relationship: "Self (Head Traveller)",
    isHead: true,
    safetyStatus: "SAFE",
    specialNeeds: ["Solo/General Traveller"],
    lastKnownLocation: "Chennai Central Station",
    lastCheckIn: "10 mins ago"
  },
  {
    id: "trav_2",
    name: "Anu Sharma",
    age: 29,
    phone: "+91 98765 11111",
    relationship: "Spouse",
    isHead: false,
    safetyStatus: "SAFE",
    specialNeeds: ["Pregnant Traveller"],
    lastKnownLocation: "Grand Chola Hotel, Guindy",
    lastCheckIn: "25 mins ago"
  },
  {
    id: "trav_3",
    name: "Priya Patel",
    age: 64,
    phone: "+91 98765 22222",
    relationship: "Mother",
    isHead: false,
    safetyStatus: "CAUTION",
    specialNeeds: ["Senior Citizen"],
    lastKnownLocation: "City Palace, Chennai",
    lastCheckIn: "1 hour ago"
  },
  {
    id: "trav_4",
    name: "Arjun Patel",
    age: 8,
    phone: "+91 98765 33333",
    relationship: "Son",
    isHead: false,
    safetyStatus: "ALERT",
    specialNeeds: ["Child"],
    lastKnownLocation: "Marina Beach vicinity",
    lastCheckIn: "5 mins ago"
  }
];

export const INITIAL_DEMO_ITINERARY = [
  {
    id: "act_1",
    day: 1,
    date: "2026-09-24",
    time: "10:00 AM",
    city: "Chennai",
    place: "City Palace",
    category: "Sightseeing",
    notes: "Historic museum tour & architecture photography."
  },
  {
    id: "act_2",
    day: 1,
    date: "2026-09-24",
    time: "3:00 PM",
    city: "Chennai",
    place: "Government Museum",
    category: "Sightseeing",
    notes: "Bronze gallery and archaeology section."
  },
  {
    id: "act_3",
    day: 2,
    date: "2026-09-25",
    time: "10:00 AM",
    city: "Chennai",
    place: "City Tour Bus",
    category: "Sightseeing",
    notes: "Heritage bus tour covering San Thome & Fort St. George."
  },
  {
    id: "act_4",
    day: 2,
    date: "2026-09-25",
    time: "3:00 PM",
    city: "Chennai",
    place: "Marina Beach",
    category: "Beach",
    notes: "Sunset coastal walk and lighthouse photography."
  },
  {
    id: "act_5",
    day: 3,
    date: "2026-09-26",
    time: "11:00 AM",
    city: "Chennai",
    place: "T. Nagar Shopping Street",
    category: "Shopping",
    notes: "Traditional Kanchipuram silk and handicraft shopping."
  }
];

export const INITIAL_DEMO_ADVISORIES = [
  {
    id: "adv_101",
    type: "High-Surf Advisory",
    city: "Chennai",
    category: "Beach",
    severity: "HIGH",
    startDate: "2026-09-24",
    endDate: "2026-09-26",
    startTime: "14:00",
    description: "Severe coastal swell and rough sea conditions with waves reaching 3.5m–4.2m along the Marina and Elliot's beach shorelines.",
    recommendation: "Avoid beach activities during the affected period. Maintain a 100m safety buffer from water's edge."
  },
  {
    id: "adv_102",
    type: "Monsoon Thunderstorm Advisory",
    city: "Chennai",
    category: "Nature",
    severity: "MODERATE",
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    startTime: "16:00",
    description: "Isolated intense rainfall and gusty winds predicted over North and Central Chennai suburban corridors.",
    recommendation: "Plan indoor backup activities, carry rain gear, and check arterial road traffic before departure."
  }
];

export const INITIAL_DEMO_NOTIFICATIONS = [
  {
    id: "notif_1",
    title: "Itinerary Safety Alert",
    type: "ITINERARY_ALERT",
    severity: "HIGH",
    message: "SafeVoyage Alert: Day 2 • 3:00 PM • Marina Beach is affected by High-Surf Advisory. Please review your itinerary.",
    affectedActivity: "Day 2 • 3:00 PM • Marina Beach",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    smsSent: true
  },
  {
    id: "notif_2",
    title: "Weather Advisory Update",
    type: "WEATHER_ALERT",
    severity: "MODERATE",
    message: "Moderate rain anticipated for Day 3 afternoon near T. Nagar corridor. Keep an umbrella handy.",
    affectedActivity: "Day 3 • 11:00 AM • T. Nagar Shopping Street",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
    smsSent: false
  }
];
