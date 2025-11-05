// src/components/AddLink.tsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { formatUrl } from '../utils/formatUrl';

const AddLink: React.FC = () => {
  // Form state (declare state only once, here)
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState(''); // comma-separated

  // Operation state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auth
  const { user, loading: authLoading } = useAuth();

  // Make Enter always submit the form (works even if the browser is finicky)
  const submitOnEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1) Guards / validation
    if (!user) {
      setError('You must be logged in to save a link.');
      return;
    }

    const processedUrl = formatUrl(url);
    if (!processedUrl) {
      setError('Please enter a valid web address, e.g. https://example.com');
      return;
    }

    // 2) Loading
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 3) Prepare data
      const linksCollectionRef = collection(db, 'users', user.uid, 'links');

      // Convert comma-separated tags into a clean array
      // (Let TS infer string[], avoids odd lints/edge typings)
      const processedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // 4) Write once
      await addDoc(linksCollectionRef, {
        url: processedUrl,
        title: title.trim(),
        tags: processedTags,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      // 5) Reset form + toast
      setSuccess(true);
      setUrl('');
      setTitle('');
      setTags('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to save link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <p>Loading...</p>;
  if (!user) return <p className="text-center text-gray-500">Please sign in to add links.</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL (Required)
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder="https://... (will be added automatically)"
            className="input-style w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title (Optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder="e.g., GRN Thai Story"
            className="input-style w-full"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags (Optional, comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder="e.g., thai, gospel, grn"
            className="input-style w-full"
          />
        </div>

        <div className="text-right">
          <button type="submit" disabled={isLoading} className="btn btn-blue">
            {isLoading ? 'Saving...' : 'Save Link'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">Link saved successfully!</p>}
      </form>
    </div>
  );
};

export default AddLink;
