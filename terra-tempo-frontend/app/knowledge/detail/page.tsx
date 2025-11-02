'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function KnowledgeArticleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  if (!articleId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Article Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No article ID provided
        </p>
        <button
          onClick={() => router.push('/knowledge')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
        >
          Back to Knowledge Base
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
      >
        ← Back
      </button>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Article #{articleId}
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            Article content would be loaded from IPFS or contract storage here.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            This is a placeholder for the knowledge base article detail page.
          </p>
        </div>
      </article>
    </div>
  );
}

export default function KnowledgeArticlePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <KnowledgeArticleContent />
    </Suspense>
  );
}

