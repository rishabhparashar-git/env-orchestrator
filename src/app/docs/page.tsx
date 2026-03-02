import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default async function DocsIndexPage() {
        // We use the README.md as the entry point for the documentation / Introduction
        const filePath = path.join(process.cwd(), "README.md");

        let content = "# Welcome to OmniEnv Docs\n\nREADME not found.";
        if (fs.existsSync(filePath)) {
                const rawFile = fs.readFileSync(filePath, "utf8");
                const parsed = matter(rawFile);
                content = parsed.content;
        }

        return <MarkdownRenderer content={content} />;
}
