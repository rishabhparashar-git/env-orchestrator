import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export async function generateStaticParams() {
  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) return [];

  const files = fs.readdirSync(docsDir);
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(".md", ""),
    }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const filePath = path.join(
    process.cwd(),
    "docs",
    `${resolvedParams.slug}.md`,
  );

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawFile = fs.readFileSync(filePath, "utf8");
  const { content } = matter(rawFile);

  return <MarkdownRenderer content={content} />;
}
