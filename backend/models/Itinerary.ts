import mongoose, { Document, Model, Schema } from "mongoose";

export interface IItineraryPlace {
  _id: mongoose.Types.ObjectId;
  name: string;
  time: string;
  location: string;
  notes?: string;
}

export interface IItineraryDay {
  dayNumber: number;
  places: IItineraryPlace[];
}

export interface IItinerary extends Document {
  userId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  days: IItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryPlaceSchema = new Schema<IItineraryPlace>(
  {
    name: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
      maxlength: [120, "Place name cannot exceed 120 characters"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
      maxlength: [40, "Time cannot exceed 40 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    _id: true,
    id: false,
  }
);

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    dayNumber: {
      type: Number,
      required: [true, "Day number is required"],
      min: [1, "Day number must be at least 1"],
    },
    places: {
      type: [ItineraryPlaceSchema],
      default: [],
    },
  },
  {
    _id: false,
    id: false,
  }
);

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip is required"],
      index: true,
      unique: true,
    },
    days: {
      type: [ItineraryDaySchema],
      default: [],
      validate: {
        validator: (days: IItineraryDay[]) => {
          const dayNumbers = days.map((day) => day.dayNumber);
          return new Set(dayNumbers).size === dayNumbers.length;
        },
        message: "Duplicate day numbers are not allowed",
      },
    },
  },
  {
    timestamps: true,
  }
);

ItinerarySchema.index({ userId: 1, tripId: 1 }, { unique: true });

const Itinerary: Model<IItinerary> =
  mongoose.models.Itinerary ||
  mongoose.model<IItinerary>("Itinerary", ItinerarySchema);

export default Itinerary;
