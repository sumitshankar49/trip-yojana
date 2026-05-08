"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Place } from "../types";

interface AddPlaceFormProps {
  tripId: string;
  onPlaceAdded: (place: Place) => void;
}

export function AddPlaceForm({ tripId, onPlaceAdded }: AddPlaceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    category: "attraction" as Place["category"],
    address: "",
    time: "",
  });

  const geocodeLocation = async () => {
    const searchQuery = formData.address || formData.name;
    
    if (!searchQuery.trim()) {
      toast.error("Please enter a place name or address first");
      return;
    }

    setIsGeocoding(true);
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        setFormData({
          ...formData,
          lat: location.lat,
          lng: location.lon,
          address: formData.address || location.display_name,
        });
        toast.success("Coordinates found!");
      } else {
        toast.error("Location not found. Please try a more specific address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find coordinates");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please enter a place name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to API - server will geocode if coordinates are missing
      const payload: Record<string, unknown> = {
        tripId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        time: formData.time,
      };

      // Only include coordinates if they exist
      if (formData.lat && formData.lng) {
        payload.lat = parseFloat(formData.lat);
        payload.lng = parseFloat(formData.lng);
      }

      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add place");
        return;
      }

      const newPlace: Place = {
        id: data.place.id,
        name: data.place.name,
        description: data.place.description || "",
        lat: data.place.lat,
        lng: data.place.lng,
        category: data.place.category,
        address: data.place.address,
        time: data.place.time,
      };

      onPlaceAdded(newPlace);
      toast.success("Place added successfully!");
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        lat: "",
        lng: "",
        category: "attraction",
        address: "",
        time: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Add place error:", error);
      toast.error("Failed to add place");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Place
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add New Place</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Place Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Golden Temple"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Full address or landmark"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Place["category"] })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="attraction">Attraction</option>
            <option value="restaurant">Restaurant</option>
            <option value="hotel">Hotel</option>
            <option value="activity">Activity</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Visit Time
          </label>
          <input
            type="text"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 10:00 AM"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Place"}
          </button>
        </div>
      </form>

      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Tip:</strong> Coordinates will be automatically found from place name and address
        </p>
      </div>
    </div>
  );
}
