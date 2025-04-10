'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          tags: tags.split(',').map((tag) => tag.trim()),
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error during fetch:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Web Scraping Search</h1>
      <input
        type="text"
        placeholder="Enter your query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ margin: '0.5rem', padding: '0.5rem' }}
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        style={{ margin: '0.5rem', padding: '0.5rem' }}
      />
      <button
        onClick={search}
        style={{ margin: '0.5rem', padding: '0.5rem' }}
      >
        Search
      </button>

      {results.length > 0 && (
        <table
          style={{
            marginTop: '2rem',
            borderCollapse: 'collapse',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              <th style={cellStyle}>Rank</th>
              <th style={cellStyle}>URL</th>
              <th style={cellStyle}>Description</th>
              <th style={cellStyle}>Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item, index) => (
              <tr key={index}>
                <td style={cellStyle}>{index + 1}</td>
                <td style={cellStyle}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </a>
                </td>
                <td style={cellStyle}>{item.description}</td>
                <td style={cellStyle}>{(item.score * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '0.5rem',
};
