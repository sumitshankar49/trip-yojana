"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/components/ui/card";
import { Input } from "@/packages/components/ui/input";
import { Label } from "@/packages/components/ui/label";
import { Button } from "@/packages/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/packages/components/ui/avatar";
import Navbar from "@/packages/components/shared/Navbar";
import { profileSchema, ProfileFormData } from "./validations";
import { ProfileData } from "./types";
import { PROFILE_LABELS, PROFILE_MESSAGES } from "./constants";
import { User, Phone, MapPin, Image as ImageIcon, Loader2 } from "lucide-react";
import { InputFieldControlled } from "@/packages/components/shared/InputFieldControlled";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      profilePhoto: "",
      city: "",
    },
  });

  const watchedPhoto = watch("profilePhoto");

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        const profile: ProfileData = data.profile;

        // Set form values
        setValue("name", profile.name || "");
        setValue("phone", profile.phone || "");
        setValue("profilePhoto", profile.profilePhoto || "");
        setValue("city", profile.city || "");
        setProfilePhoto(profile.profilePhoto || "");
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error(PROFILE_MESSAGES.FETCH_ERROR);
      } finally {
        setIsFetching(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, setValue]);

  // Update profile photo preview when URL changes
  useEffect(() => {
    if (watchedPhoto) {
      setProfilePhoto(watchedPhoto);
    }
  }, [watchedPhoto]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || PROFILE_MESSAGES.UPDATE_ERROR);
        return;
      }

      toast.success(PROFILE_MESSAGES.UPDATE_SUCCESS);
      setProfilePhoto(data.profilePhoto || "");
      
      // Update session to refresh name in dashboard
      await update({
        name: data.name,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(PROFILE_MESSAGES.UPDATE_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {PROFILE_LABELS.PAGE_TITLE}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {PROFILE_LABELS.PAGE_DESCRIPTION}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Profile Photo Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profilePhoto} alt={watch("name")} />
              <AvatarFallback className="bg-cyan-100 text-cyan-700 text-2xl">
                {getInitials(watch("name"))}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              Add a profile photo URL below to update your avatar
            </p>
          </CardContent>
        </Card>

        {/* Profile Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <InputFieldControlled
                control={control}
                name="name"
                label={PROFILE_LABELS.NAME_LABEL}
                placeholder={PROFILE_LABELS.NAME_PLACEHOLDER}
                icon={<User className="h-4 w-4" />}
                disabled={isLoading}
                required
                type="text"
              />

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {PROFILE_LABELS.EMAIL_LABEL}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="h-11 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone Field */}
              <InputFieldControlled
                control={control}
                name="phone"
                label={PROFILE_LABELS.PHONE_LABEL}
                placeholder={PROFILE_LABELS.PHONE_PLACEHOLDER}
                icon={<Phone className="h-4 w-4" />}
                disabled={isLoading}
                required
                type="tel"
              />

              {/* Profile Photo URL Field */}
              <InputFieldControlled
                control={control}
                name="profilePhoto"
                label={PROFILE_LABELS.PROFILE_PHOTO_LABEL}
                placeholder={PROFILE_LABELS.PROFILE_PHOTO_PLACEHOLDER}
                icon={<ImageIcon className="h-4 w-4" />}
                disabled={isLoading}
                type="url"
                description="Enter a valid image URL to display your profile photo"
              />

              {/* City Field */}
              <InputFieldControlled
                control={control}
                name="city"
                label={PROFILE_LABELS.CITY_LABEL}
                placeholder={PROFILE_LABELS.CITY_PLACEHOLDER}
                icon={<MapPin className="h-4 w-4" />}
                disabled={isLoading}
                type="text"
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {PROFILE_LABELS.SAVING_BUTTON}
                  </>
                ) : (
                  PROFILE_LABELS.SAVE_BUTTON
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
