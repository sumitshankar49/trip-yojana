-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "destinationCountry" TEXT,
ADD COLUMN     "destinationPincode" TEXT,
ADD COLUMN     "destinationState" TEXT,
ADD COLUMN     "sourceCountry" TEXT,
ADD COLUMN     "sourcePincode" TEXT,
ADD COLUMN     "sourceState" TEXT;
