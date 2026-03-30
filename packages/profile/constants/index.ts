export const PROFILE_LABELS = {
  PAGE_TITLE: "Profile Settings",
  PAGE_DESCRIPTION: "Manage your account settings and profile information",
  NAME_LABEL: "Full Name",
  NAME_PLACEHOLDER: "Enter your full name",
  EMAIL_LABEL: "Email Address",
  PHONE_LABEL: "Phone Number",
  PHONE_PLACEHOLDER: "+1 (555) 000-0000",
  PROFILE_PHOTO_LABEL: "Profile Photo URL",
  PROFILE_PHOTO_PLACEHOLDER: "https://example.com/photo.jpg",
  CITY_LABEL: "City",
  CITY_PLACEHOLDER: "Enter your city",
  SAVE_BUTTON: "Save Changes",
  SAVING_BUTTON: "Saving...",
} as const;

export const PROFILE_MESSAGES = {
  UPDATE_SUCCESS: "Profile updated successfully!",
  UPDATE_ERROR: "Failed to update profile",
  FETCH_ERROR: "Failed to load profile data",
} as const;
