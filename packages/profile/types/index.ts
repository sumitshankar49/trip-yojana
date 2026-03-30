export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  city?: string;
}

export interface ProfileResponse {
  profile: ProfileData;
  message?: string;
}
