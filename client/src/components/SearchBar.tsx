import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  useEffect(() => { setQuery(searchParams.get('q') ?? ''); }, [searchParams]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form className="search-bar" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="catalogue-search">Search products</label>
      <input id="catalogue-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products…" maxLength={100} />
      <button className="search-bar__button" type="submit" aria-label="Search">⌕</button>
    </form>
  );
}
