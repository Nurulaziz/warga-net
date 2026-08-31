interface PostMediaProps {
  urls: string[];
}

export function PostMedia({ urls }: PostMediaProps) {
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt="Lampiran posting"
        loading="lazy"
        className="mt-3 max-h-96 w-full rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {urls.map((url, i) => (
        <img
          key={url + i}
          src={url}
          alt={`Lampiran posting ${i + 1}`}
          loading="lazy"
          className="h-40 w-full rounded-xl object-cover"
        />
      ))}
    </div>
  );
}
