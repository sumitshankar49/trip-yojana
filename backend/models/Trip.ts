import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  places: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema<ITrip> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
      maxlength: [120, "Trip title cannot exceed 120 characters"],
    },
    budget: {
      type: Number,
      required: [true, "Trip budget is required"],
      min: [0, "Budget cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    places: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => Array.isArray(value),
        message: "Places must be an array of strings",
      },
    },
  },
  {
    timestamps: true,
  }
);

TripSchema.index({ userId: 1, createdAt: -1 });

const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;
