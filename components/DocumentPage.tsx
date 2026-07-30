import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseMarkdown } from '@/lib/markdown';
import DocumentPageClient from '@/components/DocumentPageClient';

interface DocumentPageProps {
  titleEn: string;
  titlePl: string;
  fileEn: string;
  filePl: string;
}

const readPublicDocument = async (file: string) => {
  const relativePath = file.replace(/^\/+/, '');
  if (!/^documents\/[a-z_]+\.md$/.test(relativePath)) {
    throw new Error(`Unsupported public document path: ${file}`);
  }

  return readFile(join(process.cwd(), 'public', relativePath), 'utf8');
};

export default async function DocumentPage({
  titleEn,
  titlePl,
  fileEn,
  filePl,
}: DocumentPageProps) {
  const [markdownEn, markdownPl] = await Promise.all([
    readPublicDocument(fileEn),
    readPublicDocument(filePl),
  ]);

  return (
    <DocumentPageClient
      titleEn={titleEn}
      titlePl={titlePl}
      contentEn={parseMarkdown(markdownEn)}
      contentPl={parseMarkdown(markdownPl)}
    />
  );
}

