import Link from "next/link";
import Image from "next/image";
import { Button } from "@/packages/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-green-50">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full opacity-30">
        <Image
          src="/main.png"
          alt="background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-xl px-8">
        <div className="relative w-64 h-20 mx-auto mb-4">
          <Image
            src="/brand_logo.png"
            alt="TripYojana"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Welcome to Trip Yojana
        </h1>

        <p className="text-gray-600 mt-4 text-lg">
          Plan your perfect trip with ease. Sign in to get started or create a new account.
        </p>

        <div className="mt-6 flex justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </div>

      {/* Made in India Badge */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
          <span className="text-2xl">🇮🇳</span>
          <span className="text-sm font-semibold text-gray-700">Made in India</span>
        </div>
      </div>
    </div>
  );
}
