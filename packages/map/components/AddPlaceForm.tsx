"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Place } from "../types";

interface AddPlaceFormProps {
  tripId: string;
  onPlaceAdded: (place: Place) => void;
  onMapClick?: () => void;
}

export function AddPlaceForm({ tripId, onPlaceAdded, onMapClick }: AddPlaceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
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
      // Try simplified address patterns for better results
      const queries = [
        searchQuery,
        searchQuery.replace(/near|close to|beside/gi, '').trim(),
      ];

      let found = false;
      for (const query of queries) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'TripYojana/1.0',
            },
          }
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
          found = true;
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (!found) {
        toast.error("Location not found. Try simplifying the address or enter coordinates manually.", {
          duration: 5000,
        });
        setShowManualCoords(true);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find coordinates. Try manual entry.");
      setShowManualCoords(true);
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
        // Show error with suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          toast.error(data.error, {
            description: data.suggestions[0],
            duration: 6000,
          });
        } else {
          toast.error(data.error || "Failed to add place");
        }
        
        // Show manual coordinate entry option
        if (!showManualCoords) {
          setShowManualCoords(true);
        }
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
          <div className="space-y-2">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Patna Junction, Patna"
            />
            <button
              type="button"
              onClick={geocodeLocation}
              disabled={isGeocoding || (!formData.name && !formData.address)}
              className="w-full px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeocoding ? "Finding..." : "🔍 Find Coordinates"}
            </button>
          </div>
        </div>

        {/* Manual Coordinates Section */}
        {showManualCoords && (
          <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-amber-900 dark:text-amber-200">
                Manual Coordinates
              </label>
              <button
                type="button"
                onClick={() => setShowManualCoords(false)}
                className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-amber-800 dark:text-amber-300 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="25.5941"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-800 dark:text-amber-300 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="85.1376"
                />
              </div>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              💡 Get coordinates from Google Maps: Right-click on location → Click coordinates
            </p>
          </div>
        )}

        {!showManualCoords && (
          <button
            type="button"
            onClick={() => setShowManualCoords(true)}
            className="w-full px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
          >
            Enter coordinates manually
          </button>
        )}

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
          💡 <strong>Tip:</strong> For best results, use simple addresses like "Patna Junction, Patna" instead of full detailed addresses
        </p>
      </div>
    </div>
  );
}
