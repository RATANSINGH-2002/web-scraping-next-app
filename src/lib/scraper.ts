import axios from "axios";
import * as cheerio from "cheerio";
import { TfIdf } from "natural";

// Define the structure of search results
interface SearchResult {
  url: string;
  description: string;
  score: number;
}

// Export the scrapeAndRank function
export const scrapeAndRank = async (
  query: string,
  tags: string[]
): Promise<SearchResult[]> => {
  // Define the search engine URLs
  const searchEngines = [
    `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    `https://search.brave.com/search?q=${encodeURIComponent(query)}`,
  ];

  const results: SearchResult[] = [];

  // Iterate over each search engine
  for (const url of searchEngines) {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.4430.93 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Extract links and text
      $("a").each((_, el) => {
        const link = $(el).attr("href") || "";
        const text = $(el).text().trim();

        // Validate links and avoid duplicates
        if (
          link.startsWith("http") &&
          text.length > 20 && // Ensure meaningful description
          !results.some((r) => r.url === link) // Prevent duplicates
        ) {
          results.push({
            url: link,
            description: text,
            score: 0, // Initial score
          });
        }
      });
    } catch (err: unknown) {
      // Improved error handling
      if (err instanceof Error) {
        console.error(`Error fetching ${url}: ${err.message}`);
      } else {
        console.error(`Error fetching ${url}:`, err);
      }
    }
  }

  // TF-IDF scoring using the Natural library
  const tfidf = new TfIdf();
  results.forEach((item) => {
    const doc = `${item.url} ${item.description}`;
    tfidf.addDocument(doc); // Add document for scoring
  });

  const queryText = `${query} ${tags.join(" ")}`;

  // Calculate raw scores for each result
  const rawScores = results.map((_, i) => tfidf.tfidf(queryText, i));

  // Normalize scores
  const maxScore = Math.max(...rawScores) || 1; // Avoid division by 0
  results.forEach((item, i) => {
    item.score = rawScores[i] / maxScore; // Normalize
  });

  // Sort results by score and return top 10 results
  return results
    .sort((a, b) => b.score - a.score) // Descending order
    .slice(0, 10); // Top 10 results
};
