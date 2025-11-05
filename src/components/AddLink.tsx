import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 👇 go UP one level from /components to /src
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { formatUrl } from '../utils/formatUrl';

const AddLink: React.FC = () => {
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated string

  // Operation state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get the authenticated user
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form from refreshing the page

    // --- 1. Guards and Validation ---
    if (!user) {
      setError('You must be logged in to save a link.');
      return;
    }
    const processedUrl = formatUrl(url);
    if (processedUrl === '') {
      setError('A valid URL is required.');
      return;
    }

    // --- 2. Set Loading State ---
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // --- 3. Prepare Data ---
      // We will store links in a user-specific subcollection: /users/{userId}/links
      const linksCollectionRef = collection(db, 'users', user.uid, 'links');

      // Convert tag string to an array, clean up whitespace, remove empty tags
      const processedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // --- 4. Write to Firestore ---
      await addDoc(linksCollectionRef, {
        url: processedUrl,
        title: title.trim(),
        tags: processedTags,
        createdAt: serverTimestamp(), // For sorting by date
        userId: user.uid,
      });

      // --- 5. Reset Form on Success ---
      setSuccess(true);
      setUrl('');
      setTitle('');
      setTags('');

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error adding document: ', err);
      setError('Failed to save link. Please try again.');
    } finally {
      // --- 6. Unset Loading State ---
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <p>Loading...</p>; // Or a spinner
  }

  // Render nothing if user is not logged in (or show a message)
  if (!user) {
    return <p className="text-center text-gray-500">Please sign in to add links.</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* 
        Using <form> and onSubmit handles both button clicks 
        and the "Enter" key press in any input.
      */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL (Required)
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... (will be added automatically)"
            className="input-style w-full" // Use your Tailwind @apply class
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., GRN Thai Story"
            className="input-style w-full"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium">
            Tags (Optional, comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., #Bible, #Testimony, Gospel"
            className="input-style w-full"
          />
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-blue" // Use your button style
          >
            {isLoading ? 'Saving...' : 'Save Link'}
          </button>
        </div>

        {/* --- Feedback Messages --- */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">Link saved successfully!</p>}
      </form>
    </div>
  );
};

export default AddLink;
