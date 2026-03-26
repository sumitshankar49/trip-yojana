interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  date: string;
  category: string;
}

export const TRIP_MEMBERS: Record<string, Member[]> = {
  // Golden Temple, Amritsar
  "1": [
    { id: "1", name: "Rajesh Kumar", email: "rajesh@example.com", avatar: "RK" },
    { id: "2", name: "Priya Sharma", email: "priya@example.com", avatar: "PS" },
    { id: "3", name: "Amit Singh", email: "amit@example.com", avatar: "AS" },
  ],
  
  // Tirupati Balaji Temple
  "2": [
    { id: "1", name: "Venkat Reddy", email: "venkat@example.com", avatar: "VR" },
    { id: "2", name: "Lakshmi Devi", email: "lakshmi@example.com", avatar: "LD" },
    { id: "3", name: "Ravi Kumar", email: "ravi@example.com", avatar: "RK" },
    { id: "4", name: "Sita Patel", email: "sita@example.com", avatar: "SP" },
  ],
  
  // Vaishno Devi, Katra
  "3": [
    { id: "1", name: "Suresh Gupta", email: "suresh@example.com", avatar: "SG" },
    { id: "2", name: "Meena Verma", email: "meena@example.com", avatar: "MV" },
  ],
  
  // Kedarnath Temple
  "4": [
    { id: "1", name: "Vikram Joshi", email: "vikram@example.com", avatar: "VJ" },
    { id: "2", name: "Anjali Nair", email: "anjali@example.com", avatar: "AN" },
    { id: "3", name: "Rahul Chauhan", email: "rahul@example.com", avatar: "RC" },
    { id: "4", name: "Divya Bhatt", email: "divya@example.com", avatar: "DB" },
    { id: "5", name: "Arjun Rawat", email: "arjun@example.com", avatar: "AR" },
  ],
  
  // Mahakaleshwar Temple, Ujjain
  "5": [
    { id: "1", name: "Aditya Sharma", email: "aditya@example.com", avatar: "AS" },
    { id: "2", name: "Nisha Jain", email: "nisha@example.com", avatar: "NJ" },
    { id: "3", name: "Manish Agrawal", email: "manish@example.com", avatar: "MA" },
  ],
  
  // Jagannath Temple, Puri
  "6": [
    { id: "1", name: "Soumya Das", email: "soumya@example.com", avatar: "SD" },
    { id: "2", name: "Prasad Mohanty", email: "prasad@example.com", avatar: "PM" },
    { id: "3", name: "Anuradha Patra", email: "anuradha@example.com", avatar: "AP" },
    { id: "4", name: "Biswajit Nayak", email: "biswajit@example.com", avatar: "BN" },
  ],
  
  // Somnath Temple, Gujarat
  "7": [
    { id: "1", name: "Ketan Shah", email: "ketan@example.com", avatar: "KS" },
    { id: "2", name: "Rupal Desai", email: "rupal@example.com", avatar: "RD" },
    { id: "3", name: "Dhruv Mehta", email: "dhruv@example.com", avatar: "DM" },
  ],
  
  // Badrinath Temple, Uttarakhand
  "8": [
    { id: "1", name: "Nitin Pandit", email: "nitin@example.com", avatar: "NP" },
    { id: "2", name: "Rekha Bisht", email: "rekha@example.com", avatar: "RB" },
    { id: "3", name: "Mohit Thapa", email: "mohit@example.com", avatar: "MT" },
    { id: "4", name: "Pooja Negi", email: "pooja@example.com", avatar: "PN" },
  ],
  
  // Siddhivinayak Temple, Mumbai
  "9": [
    { id: "1", name: "Rohan Pawar", email: "rohan@example.com", avatar: "RP" },
    { id: "2", name: "Sneha Kulkarni", email: "sneha@example.com", avatar: "SK" },
  ],
};

export const TRIP_EXPENSES: Record<string, Expense[]> = {
  // Golden Temple, Amritsar - 3 members
  "1": [
    {
      id: "1",
      description: "Hotel booking - 2 nights",
      amount: 6000,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-04-15",
      category: "Accommodation",
    },
    {
      id: "2",
      description: "Wagah Border taxi",
      amount: 1500,
      paidBy: "2",
      splitBetween: ["1", "2", "3"],
      date: "2026-04-16",
      category: "Transport",
    },
    {
      id: "3",
      description: "Traditional Punjabi dinner",
      amount: 2400,
      paidBy: "3",
      splitBetween: ["1", "2", "3"],
      date: "2026-04-16",
      category: "Food",
    },
    {
      id: "4",
      description: "Local shopping at Amritsar market",
      amount: 3000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-04-17",
      category: "Shopping",
    },
  ],
  
  // Tirupati Balaji Temple - 4 members
  "2": [
    {
      id: "1",
      description: "Hotel booking - 5 nights",
      amount: 12000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-10",
      category: "Accommodation",
    },
    {
      id: "2",
      description: "Tirupati Darshan tickets",
      amount: 1200,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-11",
      category: "Activities",
    },
    {
      id: "3",
      description: "Breakfast at temple",
      amount: 600,
      paidBy: "3",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-11",
      category: "Food",
    },
    {
      id: "4",
      description: "Talakona waterfall trip",
      amount: 2400,
      paidBy: "4",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-13",
      category: "Activities",
    },
    {
      id: "5",
      description: "Pooja materials and laddu prasadam",
      amount: 4000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-14",
      category: "Shopping",
    },
    {
      id: "6",
      description: "South Indian thali lunch",
      amount: 2000,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-14",
      category: "Food",
    },
  ],
  
  // Vaishno Devi, Katra - 2 members
  "3": [
    {
      id: "1",
      description: "Hotel booking - 4 nights",
      amount: 8000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-08-05",
      category: "Accommodation",
    },
    {
      id: "2",
      description: "Taxi from Jammu to Katra",
      amount: 3000,
      paidBy: "2",
      splitBetween: ["1", "2"],
      date: "2026-08-05",
      category: "Transport",
    },
    {
      id: "3",
      description: "Ponies for trek",
      amount: 2000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-08-06",
      category: "Activities",
    },
    {
      id: "4",
      description: "Food and refreshments during trek",
      amount: 1500,
      paidBy: "2",
      splitBetween: ["1", "2"],
      date: "2026-08-07",
      category: "Food",
    },
    {
      id: "5",
      description: "Patnitop sightseeing",
      amount: 4000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-08-08",
      category: "Activities",
    },
  ],
  
  // Kedarnath Temple - 5 members
  "4": [
    {
      id: "1",
      description: "Hotels in Haridwar & Kedarnath",
      amount: 15000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-01",
      category: "Accommodation",
    },
    {
      id: "2",
      description: "Taxi to Gaurikund",
      amount: 7000,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-02",
      category: "Transport",
    },
    {
      id: "3",
      description: "Helicopter booking (backup)",
      amount: 10000,
      paidBy: "3",
      splitBetween: ["1", "2", "3"],
      date: "2026-05-02",
      category: "Transport",
    },
    {
      id: "4",
      description: "Trekking gear rental",
      amount: 5000,
      paidBy: "4",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-02",
      category: "Activities",
    },
    {
      id: "5",
      description: "Kedarnath temple offerings",
      amount: 2500,
      paidBy: "5",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-03",
      category: "Activities",
    },
    {
      id: "6",
      description: "Meals during trek",
      amount: 4000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-03",
      category: "Food",
    },
    {
      id: "7",
      description: "Vasuki Tal trek guide",
      amount: 3000,
      paidBy: "2",
      splitBetween: ["1", "2", "4"],
      date: "2026-05-04",
      category: "Activities",
    },
    {
      id: "8",
      description: "Rishikesh rafting",
      amount: 7500,
      paidBy: "3",
      splitBetween: ["1", "2", "3", "4", "5"],
      date: "2026-05-06",
      category: "Activities",
    },
  ],
  
  // Mahakaleshwar Temple, Ujjain
  "5": [
    {
      id: "1",
      description: "Flight tickets to Indore",
      amount: 15000,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-20",
      category: "Transport",
    },
    {
      id: "2",
      description: "Taxi from Indore to Ujjain",
      amount: 3000,
      paidBy: "2",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-20",
      category: "Transport",
    },
    {
      id: "3",
      description: "Hotel booking for 5 nights",
      amount: 10500,
      paidBy: "3",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-20",
      category: "Accommodation",
    },
    {
      id: "4",
      description: "Bhasma Aarti booking fees",
      amount: 750,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-21",
      category: "Activities",
    },
    {
      id: "5",
      description: "Day trip to Omkareshwar",
      amount: 5000,
      paidBy: "2",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-23",
      category: "Transport",
    },
    {
      id: "6",
      description: "Meals and local food",
      amount: 3600,
      paidBy: "3",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-22",
      category: "Food",
    },
    {
      id: "7",
      description: "Shopping and souvenirs",
      amount: 2400,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-07-24",
      category: "Shopping",
    },
  ],
  
  // Jagannath Temple, Puri
  "6": [
    {
      id: "1",
      description: "Flight to Bhubaneswar",
      amount: 20000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-10",
      category: "Transport",
    },
    {
      id: "2",
      description: "Hotel at Puri beach",
      amount: 14000,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-10",
      category: "Accommodation",
    },
    {
      id: "3",
      description: "Mahaprasad at Jagannath Temple",
      amount: 2000,
      paidBy: "3",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-11",
      category: "Food",
    },
    {
      id: "4",
      description: "Konark Sun Temple tour",
      amount: 4000,
      paidBy: "4",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-12",
      category: "Transport",
    },
    {
      id: "5",
      description: "Chilika Lake boat ride",
      amount: 3200,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-13",
      category: "Activities",
    },
    {
      id: "6",
      description: "Beach activities and snacks",
      amount: 1200,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-09-11",
      category: "Food",
    },
  ],
  
  // Somnath Temple, Gujarat
  "7": [
    {
      id: "1",
      description: "Flight to Rajkot",
      amount: 13500,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-10-05",
      category: "Transport",
    },
    {
      id: "2",
      description: "Taxi to Somnath",
      amount: 4000,
      paidBy: "2",
      splitBetween: ["1", "2", "3"],
      date: "2026-10-05",
      category: "Transport",
    },
    {
      id: "3",
      description: "Hotel accommodation",
      amount: 9000,
      paidBy: "3",
      splitBetween: ["1", "2", "3"],
      date: "2026-10-05",
      category: "Accommodation",
    },
    {
      id: "4",
      description: "Gir National Park safari",
      amount: 5500,
      paidBy: "1",
      splitBetween: ["1", "2", "3"],
      date: "2026-10-07",
      category: "Activities",
    },
    {
      id: "5",
      description: "Day trip to Diu",
      amount: 3000,
      paidBy: "2",
      splitBetween: ["1", "2", "3"],
      date: "2026-10-08",
      category: "Transport",
    },
  ],
  
  // Badrinath Temple, Uttarakhand
  "8": [
    {
      id: "1",
      description: "Flight to Dehradun",
      amount: 24000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-15",
      category: "Transport",
    },
    {
      id: "2",
      description: "Hotels in Haridwar & Joshimath",
      amount: 16000,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-15",
      category: "Accommodation",
    },
    {
      id: "3",
      description: "Taxi to Badrinath",
      amount: 8500,
      paidBy: "3",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-16",
      category: "Transport",
    },
    {
      id: "4",
      description: "Temple offerings and rituals",
      amount: 2000,
      paidBy: "4",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-17",
      category: "Activities",
    },
    {
      id: "5",
      description: "Vasudhara Falls trek",
      amount: 4000,
      paidBy: "1",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-18",
      category: "Activities",
    },
    {
      id: "6",
      description: "Auli cable car tickets",
      amount: 3200,
      paidBy: "2",
      splitBetween: ["1", "2", "3", "4"],
      date: "2026-06-19",
      category: "Activities",
    },
  ],
  
  // Siddhivinayak Temple, Mumbai
  "9": [
    {
      id: "1",
      description: "Flight to Mumbai",
      amount: 8000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-11-12",
      category: "Transport",
    },
    {
      id: "2",
      description: "Hotel in South Mumbai",
      amount: 9000,
      paidBy: "2",
      splitBetween: ["1", "2"],
      date: "2026-11-12",
      category: "Accommodation",
    },
    {
      id: "3",
      description: "Ferry to Elephanta Caves",
      amount: 1000,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-11-13",
      category: "Transport",
    },
    {
      id: "4",
      description: "Shopping at Colaba Causeway",
      amount: 5000,
      paidBy: "2",
      splitBetween: ["1", "2"],
      date: "2026-11-14",
      category: "Shopping",
    },
    {
      id: "5",
      description: "Street food tour",
      amount: 1200,
      paidBy: "1",
      splitBetween: ["1", "2"],
      date: "2026-11-14",
      category: "Food",
    },
  ],
};

export type { Member, Expense };
