export const formatUrl = (url: string): string => {
  let trimmedUrl = url.trim();
  if (trimmedUrl === '') return '';

  // If it doesn't have http:// or https://, prepend https://
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    trimmedUrl = 'https://' + trimmedUrl;
  }
  return trimmedUrl;
};
