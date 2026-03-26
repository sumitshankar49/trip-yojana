"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/packages/components/ui/input";
import { cn } from "@/packages/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  showShortcut?: boolean;
}

export default function SearchBar({
  placeholder = "Search trips, places...",
  onSearch,
  debounceMs = 300,
  className,
  autoFocus = false,
  showShortcut = true,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Input Field */}
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
        className={cn(
          "pl-10 pr-20 h-11 rounded-full shadow-sm",
          "focus-visible:shadow-md transition-shadow"
        )}
      />

      {/* Right side elements */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-muted transition-colors group"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Keyboard Shortcut Hint - hide during SSR to avoid hydration warning */}
        {showShortcut && !query && (
          <kbd 
            className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
            suppressHydrationWarning
          >
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  );
}
