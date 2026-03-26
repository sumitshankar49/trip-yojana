interface Activity {
  id: string;
  title: string;
  time: string;
  cost: number;
}

interface Day {
  id: number;
  date: string;
  activities: Activity[];
}

export const TRIP_ITINERARIES: Record<string, { title: string; dates: string; days: Day[] }> = {
  // Golden Temple, Amritsar
  "1": {
    title: "Golden Temple, Amritsar Itinerary",
    dates: "April 15 - 18, 2026",
    days: [
      {
        id: 1,
        date: "Apr 15, 2026",
        activities: [
          { id: "1", title: "Flight to Amritsar", time: "06:00 AM", cost: 4500 },
          { id: "2", title: "Hotel Check-in", time: "12:00 PM", cost: 0 },
          { id: "3", title: "Golden Temple Visit", time: "04:00 PM", cost: 0 },
          { id: "4", title: "Langar Seva (Community Kitchen)", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Apr 16, 2026",
        activities: [
          { id: "5", title: "Early Morning Darshan", time: "05:00 AM", cost: 0 },
          { id: "6", title: "Jallianwala Bagh Visit", time: "10:00 AM", cost: 0 },
          { id: "7", title: "Wagah Border Ceremony", time: "04:00 PM", cost: 500 },
          { id: "8", title: "Traditional Punjabi Dinner", time: "08:00 PM", cost: 800 },
        ],
      },
      {
        id: 3,
        date: "Apr 17, 2026",
        activities: [
          { id: "9", title: "Partition Museum", time: "09:00 AM", cost: 200 },
          { id: "10", title: "Local Market Shopping", time: "12:00 PM", cost: 2000 },
          { id: "11", title: "Golden Temple Evening Visit", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 4,
        date: "Apr 18, 2026",
        activities: [
          { id: "12", title: "Breakfast at Kesar Da Dhaba", time: "08:00 AM", cost: 300 },
          { id: "13", title: "Ram Bagh Gardens", time: "10:00 AM", cost: 50 },
          { id: "14", title: "Flight Back Home", time: "03:00 PM", cost: 4500 },
        ],
      },
    ],
  },

  // Tirupati Balaji Temple
  "2": {
    title: "Tirupati Balaji Temple Itinerary",
    dates: "June 10 - 15, 2026",
    days: [
      {
        id: 1,
        date: "Jun 10, 2026",
        activities: [
          { id: "1", title: "Flight to Tirupati", time: "07:00 AM", cost: 5500 },
          { id: "2", title: "Hotel Check-in", time: "01:00 PM", cost: 0 },
          { id: "3", title: "Sri Padmavathi Temple Visit", time: "04:00 PM", cost: 200 },
          { id: "4", title: "Local Temple Dinner", time: "07:00 PM", cost: 400 },
        ],
      },
      {
        id: 2,
        date: "Jun 11, 2026",
        activities: [
          { id: "5", title: "Early Darshan at Tirumala", time: "03:00 AM", cost: 300 },
          { id: "6", title: "Hair Donation Ceremony", time: "06:00 AM", cost: 0 },
          { id: "7", title: "Breakfast at Temple", time: "08:00 AM", cost: 150 },
          { id: "8", title: "Rest and Meditation", time: "11:00 AM", cost: 0 },
        ],
      },
      {
        id: 3,
        date: "Jun 12, 2026",
        activities: [
          { id: "9", title: "Akasa Ganga Waterfall Trek", time: "07:00 AM", cost: 500 },
          { id: "10", title: "Temple Museum Visit", time: "02:00 PM", cost: 100 },
          { id: "11", title: "Evening Aarti", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 4,
        date: "Jun 13, 2026",
        activities: [
          { id: "12", title: "Talakona Waterfall Day Trip", time: "08:00 AM", cost: 1200 },
          { id: "13", title: "Picnic Lunch", time: "12:30 PM", cost: 600 },
          { id: "14", title: "Return to Hotel", time: "05:00 PM", cost: 0 },
        ],
      },
      {
        id: 5,
        date: "Jun 14, 2026",
        activities: [
          { id: "15", title: "Morning Temple Visit", time: "06:00 AM", cost: 0 },
          { id: "16", title: "Local Shopping", time: "10:00 AM", cost: 3000 },
          { id: "17", title: "South Indian Thali Lunch", time: "01:00 PM", cost: 500 },
        ],
      },
      {
        id: 6,
        date: "Jun 15, 2026",
        activities: [
          { id: "18", title: "Hotel Checkout", time: "09:00 AM", cost: 0 },
          { id: "19", title: "Final Temple Darshan", time: "10:00 AM", cost: 0 },
          { id: "20", title: "Flight Back Home", time: "03:00 PM", cost: 5500 },
        ],
      },
    ],
  },

  // Vaishno Devi, Katra
  "3": {
    title: "Vaishno Devi, Katra Itinerary",
    dates: "August 5 - 10, 2026",
    days: [
      {
        id: 1,
        date: "Aug 5, 2026",
        activities: [
          { id: "1", title: "Flight to Jammu", time: "06:00 AM", cost: 6000 },
          { id: "2", title: "Drive to Katra", time: "12:00 PM", cost: 1500 },
          { id: "3", title: "Hotel Check-in", time: "03:00 PM", cost: 0 },
          { id: "4", title: "Rest and Preparation", time: "05:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Aug 6, 2026",
        activities: [
          { id: "5", title: "Trek Start from Katra", time: "02:00 AM", cost: 0 },
          { id: "6", title: "Banganga Darshan", time: "05:00 AM", cost: 0 },
          { id: "7", title: "Ardh Kuwari Cave Visit", time: "10:00 AM", cost: 0 },
          { id: "8", title: "Reach Bhawan (Main Temple)", time: "03:00 PM", cost: 0 },
        ],
      },
      {
        id: 3,
        date: "Aug 7, 2026",
        activities: [
          { id: "9", title: "Vaishno Devi Darshan", time: "04:00 AM", cost: 100 },
          { id: "10", title: "Bhairavnath Temple Visit", time: "07:00 AM", cost: 0 },
          { id: "11", title: "Trek Back to Katra", time: "11:00 AM", cost: 0 },
          { id: "12", title: "Rest at Hotel", time: "05:00 PM", cost: 0 },
        ],
      },
      {
        id: 4,
        date: "Aug 8, 2026",
        activities: [
          { id: "13", title: "Patnitop Sightseeing", time: "08:00 AM", cost: 2000 },
          { id: "14", title: "Lunch at Patnitop", time: "01:00 PM", cost: 800 },
          { id: "15", title: "Return to Katra", time: "04:00 PM", cost: 0 },
        ],
      },
      {
        id: 5,
        date: "Aug 9, 2026",
        activities: [
          { id: "16", title: "Local Temple Visits", time: "08:00 AM", cost: 0 },
          { id: "17", title: "Shopping at Katra Market", time: "11:00 AM", cost: 2500 },
          { id: "18", title: "Traditional Kashmiri Dinner", time: "07:00 PM", cost: 900 },
        ],
      },
      {
        id: 6,
        date: "Aug 10, 2026",
        activities: [
          { id: "19", title: "Hotel Checkout", time: "09:00 AM", cost: 0 },
          { id: "20", title: "Drive to Jammu", time: "11:00 AM", cost: 1500 },
          { id: "21", title: "Flight Back Home", time: "04:00 PM", cost: 6000 },
        ],
      },
    ],
  },

  // Kedarnath Temple
  "4": {
    title: "Kedarnath Temple Itinerary",
    dates: "May 1 - 7, 2026",
    days: [
      {
        id: 1,
        date: "May 1, 2026",
        activities: [
          { id: "1", title: "Flight to Dehradun", time: "06:00 AM", cost: 5000 },
          { id: "2", title: "Drive to Haridwar", time: "12:00 PM", cost: 2000 },
          { id: "3", title: "Hotel Check-in", time: "04:00 PM", cost: 0 },
          { id: "4", title: "Ganga Aarti at Har Ki Pauri", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "May 2, 2026",
        activities: [
          { id: "5", title: "Drive to Gaurikund", time: "05:00 AM", cost: 3500 },
          { id: "6", title: "Trek Start to Kedarnath", time: "10:00 AM", cost: 0 },
          { id: "7", title: "Lunch at Bhimbali", time: "02:00 PM", cost: 500 },
          { id: "8", title: "Reach Kedarnath", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 3,
        date: "May 3, 2026",
        activities: [
          { id: "9", title: "Kedarnath Morning Darshan", time: "04:00 AM", cost: 500 },
          { id: "10", title: "Temple Complex Exploration", time: "08:00 AM", cost: 0 },
          { id: "11", title: "Chorabari Tal Trek", time: "11:00 AM", cost: 0 },
          { id: "12", title: "Evening Temple Visit", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 4,
        date: "May 4, 2026",
        activities: [
          { id: "13", title: "Vasuki Tal Day Trek", time: "06:00 AM", cost: 1000 },
          { id: "14", title: "Packed Lunch", time: "12:00 PM", cost: 400 },
          { id: "15", title: "Return to Kedarnath", time: "04:00 PM", cost: 0 },
        ],
      },
      {
        id: 5,
        date: "May 5, 2026",
        activities: [
          { id: "16", title: "Final Darshan", time: "05:00 AM", cost: 0 },
          { id: "17", title: "Trek Back to Gaurikund", time: "08:00 AM", cost: 0 },
          { id: "18", title: "Drive to Rishikesh", time: "03:00 PM", cost: 2500 },
        ],
      },
      {
        id: 6,
        date: "May 6, 2026",
        activities: [
          { id: "19", title: "Yoga Session at Rishikesh", time: "06:00 AM", cost: 500 },
          { id: "20", title: "River Rafting", time: "10:00 AM", cost: 1500 },
          { id: "21", title: "Triveni Ghat Aarti", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 7,
        date: "May 7, 2026",
        activities: [
          { id: "22", title: "Hotel Checkout", time: "09:00 AM", cost: 0 },
          { id: "23", title: "Drive to Dehradun", time: "11:00 AM", cost: 1500 },
          { id: "24", title: "Flight Back Home", time: "04:00 PM", cost: 5000 },
        ],
      },
    ],
  },
  
  // Shri Mahakaleshwar Jyotirlinga Temple, Ujjain
  "5": {
    title: "Mahakaleshwar Temple, Ujjain Itinerary",
    dates: "July 20 - 25, 2026",
    days: [
      {
        id: 1,
        date: "Jul 20, 2026",
        activities: [
          { id: "1", title: "Flight to Indore", time: "07:00 AM", cost: 5000 },
          { id: "2", title: "Drive to Ujjain", time: "12:00 PM", cost: 1500 },
          { id: "3", title: "Hotel Check-in", time: "02:00 PM", cost: 0 },
          { id: "4", title: "Mahakaleshwar Evening Aarti", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Jul 21, 2026",
        activities: [
          { id: "5", title: "Bhasma Aarti (must book in advance)", time: "04:00 AM", cost: 250 },
          { id: "6", title: "Holy bath at Ram Ghat", time: "06:00 AM", cost: 0 },
          { id: "7", title: "Kal Bhairav Temple Visit", time: "10:00 AM", cost: 0 },
          { id: "8", title: "Traditional Malwa lunch", time: "01:00 PM", cost: 500 },
        ],
      },
      {
        id: 3,
        date: "Jul 22, 2026",
        activities: [
          { id: "9", title: "Harsiddhi Temple Visit", time: "07:00 AM", cost: 0 },
          { id: "10", title: "Vedh Shala (Observatory) Tour", time: "10:00 AM", cost: 100 },
          { id: "11", title: "Local market shopping", time: "03:00 PM", cost: 1500 },
          { id: "12", title: "Shipra River evening walk", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 4,
        date: "Jul 23, 2026",
        activities: [
          { id: "13", title: "Day trip to Omkareshwar", time: "06:00 AM", cost: 2500 },
          { id: "14", title: "Omkareshwar Jyotirlinga Darshan", time: "09:00 AM", cost: 0 },
          { id: "15", title: "Narmada River boat ride", time: "12:00 PM", cost: 300 },
          { id: "16", title: "Return to Ujjain", time: "06:00 PM", cost: 2500 },
        ],
      },
      {
        id: 5,
        date: "Jul 24, 2026",
        activities: [
          { id: "17", title: "Morning Temple Darshan", time: "05:00 AM", cost: 0 },
          { id: "18", title: "Sandipani Ashram Visit", time: "09:00 AM", cost: 0 },
          { id: "19", title: "Mangalnath Temple", time: "11:00 AM", cost: 0 },
          { id: "20", title: "Farewell dinner", time: "07:00 PM", cost: 800 },
        ],
      },
    ],
  },
  
  // Jagannath Temple, Puri
  "6": {
    title: "Jagannath Temple, Puri Itinerary",
    dates: "September 10 - 15, 2026",
    days: [
      {
        id: 1,
        date: "Sep 10, 2026",
        activities: [
          { id: "1", title: "Flight to Bhubaneswar", time: "08:00 AM", cost: 5000 },
          { id: "2", title: "Drive to Puri", time: "12:00 PM", cost: 1500 },
          { id: "3", title: "Hotel Check-in", time: "02:00 PM", cost: 0 },
          { id: "4", title: "Puri Beach Evening Walk", time: "05:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Sep 11, 2026",
        activities: [
          { id: "5", title: "Jagannath Temple Morning Darshan", time: "05:00 AM", cost: 0 },
          { id: "6", title: "Gundicha Temple Visit", time: "09:00 AM", cost: 0 },
          { id: "7", title: "Mahaprasad Lunch", time: "12:00 PM", cost: 500 },
          { id: "8", title: "Beach Activities", time: "04:00 PM", cost: 300 },
        ],
      },
      {
        id: 3,
        date: "Sep 12, 2026",
        activities: [
          { id: "9", title: "Konark Sun Temple Day Trip", time: "07:00 AM", cost: 1000 },
          { id: "10", title: "Chandrabhaga Beach", time: "11:00 AM", cost: 0 },
          { id: "11", title: "Lunch at Konark", time: "01:00 PM", cost: 600 },
          { id: "12", title: "Return to Puri", time: "05:00 PM", cost: 1000 },
        ],
      },
      {
        id: 4,
        date: "Sep 13, 2026",
        activities: [
          { id: "13", title: "Chilika Lake Day Trip", time: "06:00 AM", cost: 2000 },
          { id: "14", title: "Dolphin Watching", time: "09:00 AM", cost: 800 },
          { id: "15", title: "Kalijai Temple Visit", time: "12:00 PM", cost: 0 },
          { id: "16", title: "Return to Puri", time: "06:00 PM", cost: 2000 },
        ],
      },
      {
        id: 5,
        date: "Sep 14, 2026",
        activities: [
          { id: "17", title: "Temple Final Darshan", time: "05:00 AM", cost: 0 },
          { id: "18", title: "Shopping at Swargadwar", time: "10:00 AM", cost: 1500 },
          { id: "19", title: "Beach Sunset", time: "05:30 PM", cost: 0 },
        ],
      },
    ],
  },
  
  // Somnath Temple, Gujarat
  "7": {
    title: "Somnath Temple, Gujarat Itinerary",
    dates: "October 5 - 9, 2026",
    days: [
      {
        id: 1,
        date: "Oct 5, 2026",
        activities: [
          { id: "1", title: "Flight to Rajkot", time: "09:00 AM", cost: 4500 },
          { id: "2", title: "Drive to Somnath", time: "01:00 PM", cost: 2000 },
          { id: "3", title: "Hotel Check-in", time: "04:00 PM", cost: 0 },
          { id: "4", title: "Somnath Temple Evening Aarti", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Oct 6, 2026",
        activities: [
          { id: "5", title: "Somnath Temple Morning Darshan", time: "05:00 AM", cost: 0 },
          { id: "6", title: "Bhalka Tirtha Visit", time: "08:00 AM", cost: 0 },
          { id: "7", title: "Triveni Sangam", time: "10:00 AM", cost: 0 },
          { id: "8", title: "Sound and Light Show", time: "08:00 PM", cost: 100 },
        ],
      },
      {
        id: 3,
        date: "Oct 7, 2026",
        activities: [
          { id: "9", title: "Somnath Beach Morning Walk", time: "06:00 AM", cost: 0 },
          { id: "10", title: "Day Trip to Gir National Park", time: "08:00 AM", cost: 3500 },
          { id: "11", title: "Lion Safari", time: "11:00 AM", cost: 2000 },
          { id: "12", title: "Return to Somnath", time: "06:00 PM", cost: 3500 },
        ],
      },
      {
        id: 4,
        date: "Oct 8, 2026",
        activities: [
          { id: "13", title: "Visit to Diu", time: "07:00 AM", cost: 1500 },
          { id: "14", title: "Diu Fort Exploration", time: "10:00 AM", cost: 50 },
          { id: "15", title: "Nagoa Beach", time: "02:00 PM", cost: 0 },
          { id: "16", title: "Return to Somnath", time: "07:00 PM", cost: 1500 },
        ],
      },
    ],
  },
  
  // Badrinath Temple, Uttarakhand
  "8": {
    title: "Badrinath Temple Itinerary",
    dates: "June 15 - 21, 2026",
    days: [
      {
        id: 1,
        date: "Jun 15, 2026",
        activities: [
          { id: "1", title: "Flight to Dehradun", time: "06:00 AM", cost: 6000 },
          { id: "2", title: "Drive to Haridwar", time: "11:00 AM", cost: 1500 },
          { id: "3", title: "Hotel Check-in", time: "03:00 PM", cost: 0 },
          { id: "4", title: "Har Ki Pauri Aarti", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Jun 16, 2026",
        activities: [
          { id: "5", title: "Drive to Joshimath", time: "06:00 AM", cost: 3500 },
          { id: "6", title: "Stop at Devprayag", time: "09:00 AM", cost: 0 },
          { id: "7", title: "Lunch at Rudraprayag", time: "01:00 PM", cost: 600 },
          { id: "8", title: "Reach Joshimath", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 3,
        date: "Jun 17, 2026",
        activities: [
          { id: "9", title: "Drive to Badrinath", time: "06:00 AM", cost: 1500 },
          { id: "10", title: "Tapt Kund Holy Bath", time: "08:00 AM", cost: 0 },
          { id: "11", title: "Badrinath Temple Darshan", time: "09:00 AM", cost: 0 },
          { id: "12", title: "Brahma Kapal Ritual", time: "02:00 PM", cost: 500 },
        ],
      },
      {
        id: 4,
        date: "Jun 18, 2026",
        activities: [
          { id: "13", title: "Mana Village Visit", time: "07:00 AM", cost: 0 },
          { id: "14", title: "Vasudhara Falls Trek", time: "08:00 AM", cost: 1000 },
          { id: "15", title: "Bhim Pul Visit", time: "02:00 PM", cost: 0 },
          { id: "16", title: "Evening Temple Aarti", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 5,
        date: "Jun 19, 2026",
        activities: [
          { id: "17", title: "Final Morning Darshan", time: "05:00 AM", cost: 0 },
          { id: "18", title: "Drive to Auli", time: "10:00 AM", cost: 2000 },
          { id: "19", title: "Cable Car Ride", time: "02:00 PM", cost: 800 },
          { id: "20", title: "Overnight at Auli", time: "07:00 PM", cost: 0 },
        ],
      },
      {
        id: 6,
        date: "Jun 20, 2026",
        activities: [
          { id: "21", title: "Auli Scenic Views", time: "06:00 AM", cost: 0 },
          { id: "22", title: "Drive to Rishikesh", time: "10:00 AM", cost: 3500 },
          { id: "23", title: "Lakshman Jhula Visit", time: "05:00 PM", cost: 0 },
        ],
      },
    ],
  },
  
  // Siddhivinayak Temple, Mumbai
  "9": {
    title: "Siddhivinayak Temple, Mumbai Itinerary",
    dates: "November 12 - 15, 2026",
    days: [
      {
        id: 1,
        date: "Nov 12, 2026",
        activities: [
          { id: "1", title: "Flight to Mumbai", time: "08:00 AM", cost: 4000 },
          { id: "2", title: "Hotel Check-in", time: "11:00 AM", cost: 0 },
          { id: "3", title: "Siddhivinayak Temple Darshan", time: "02:00 PM", cost: 0 },
          { id: "4", title: "Marine Drive Evening", time: "06:00 PM", cost: 0 },
        ],
      },
      {
        id: 2,
        date: "Nov 13, 2026",
        activities: [
          { id: "5", title: "Gateway of India Visit", time: "08:00 AM", cost: 0 },
          { id: "6", title: "Ferry to Elephanta Caves", time: "09:00 AM", cost: 500 },
          { id: "7", title: "Elephanta Caves Tour", time: "10:30 AM", cost: 250 },
          { id: "8", title: "Return and Haji Ali Dargah", time: "04:00 PM", cost: 0 },
        ],
      },
      {
        id: 3,
        date: "Nov 14, 2026",
        activities: [
          { id: "9", title: "Mahalaxmi Temple", time: "06:00 AM", cost: 0 },
          { id: "10", title: "Dhobi Ghat Visit", time: "09:00 AM", cost: 0 },
          { id: "11", title: "Shopping at Colaba Causeway", time: "11:00 AM", cost: 2500 },
          { id: "12", title: "Chowpatty Beach Sunset", time: "06:00 PM", cost: 0 },
        ],
      },
    ],
  },
};

export type { Activity, Day };
