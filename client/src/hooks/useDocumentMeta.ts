import { useEffect } from 'react';

export function useDocumentMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title;
    if (!description) return;
    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', description);
  }, [title, description]);
}