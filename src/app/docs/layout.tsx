import { BookOpen, Shield, HardDrive, Lock, Home, Code2 } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

const NAV_LINKS = [
        { name: "Introduction", path: "/docs", icon: Home },
        { name: "High-Level Architecture", path: "/docs/architecture", icon: Code2 },
        { name: "Encryption Engine", path: "/docs/encryption-engine", icon: Shield },
        { name: "Local Storage Data", path: "/docs/local-storage", icon: HardDrive },
        { name: "Single-Tab Guard", path: "/docs/single-tab-guard", icon: Lock },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
        return (
                <div className="min-h-screen pt-24 pb-12 transition-colors duration-500">
                        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
                                <div className="grid lg:grid-cols-12 gap-8">

                                        {/* Docs Sidebar Navigation */}
                                        <div className="lg:col-span-3 space-y-2">
                                                <div className="glass-panel p-4 rounded-xl sticky top-24">
                                                        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4 px-2 flex items-center">
                                                                <BookOpen className="w-4 h-4 mr-2" /> Documentation
                                                        </h2>
                                                        <nav className="space-y-1">
                                                                {NAV_LINKS.map(link => (
                                                                        <Link
                                                                                key={link.path}
                                                                                href={link.path}
                                                                                className="flex items-center text-sm px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-foreground/80 font-medium"
                                                                        >
                                                                                <link.icon className="w-4 h-4 mr-3 opacity-70" />
                                                                                {link.name}
                                                                        </Link>
                                                                ))}
                                                        </nav>

                                                        <div className="mt-8 pt-6 border-t border-border px-2">
                                                                <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center">
                                                                        ← Back to Application
                                                                </Link>
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Markdown Rendering Container */}
                                        <div className="lg:col-span-9">
                                                <div className="glass-panel p-8 lg:p-12 rounded-xl animate-in fade-in slide-in-from-bottom-4">
                                                        <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:text-foreground/80 prose-headings:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 max-w-none">
                                                                {children}
                                                        </div>
                                                </div>
                                        </div>

                                </div>
                        </div>
                </div>
        );
}
