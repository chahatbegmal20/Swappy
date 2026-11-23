import Link from "next/link";

export function HomeFooter() {
  return (
    <footer className="border-t border-atelier px-4 py-12 text-center sm:px-6">
      <p className="font-display text-sm tracking-[0.2em] text-champagne uppercase">
        Swappy Studio
      </p>
      <p className="mt-3 text-sm text-muted-atelier">
        Creator intelligence today. AI agents tomorrow.
      </p>
      <p className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-atelier">
        <Link href="/trends" className="hover:text-pearl">
          Trends
        </Link>
        <Link href="/#capabilities" className="hover:text-pearl">
          Capabilities
        </Link>
        <Link href="/auth/register" className="hover:text-pearl">
          Start free
        </Link>
      </p>
      <p className="mt-8 text-xs text-muted-atelier/80">
        © {new Date().getFullYear()} Swappy Studio. All rights reserved.
      </p>
    </footer>
  );
}
