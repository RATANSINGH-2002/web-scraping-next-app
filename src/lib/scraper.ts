import puppeteer from "puppeteer";
import { TfIdf } from "natural";

// Define the structure of search results
interface SearchResult {
  url: string;
  description: string;
  score: number;
}

// Function to scrape search engine results using Puppeteer
const scrapeSearchEngine = async (url: string): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set User-Agent to mimic a real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.4430.93 Safari/537.36"
    );

    // Navigate to the search engine URL
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for search results to load
    await page.waitForSelector("a"); // Modify selector based on search engine

    // Extract links and descriptions from the page
    const extractedData = await page.evaluate(() => {
      const data: SearchResult[] = [];
      const anchors = document.querySelectorAll("a"); // Adjust selector as needed
      anchors.forEach((anchor) => {
        const url = anchor.getAttribute("href");
        const description = anchor.textContent?.trim();
        if (url && description && description.length > 50) {
          data.push({ url, description, score: 0 });
        }
      });
      return data;
    });

    results.push(...extractedData);
    await browser.close();
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
  }

  return results;
};

// Main scrape and rank function using Puppeteer with Promise.all
export const scrapeAndRank = async (
  userQuery: string,
  tags: string[]
): Promise<SearchResult[]> => {
  const searchEngines = [
    `https://www.bing.com/search?q=${encodeURIComponent(userQuery)}`,
    `https://www.google.com/search?q=${encodeURIComponent(userQuery)}`,
    `https://search.brave.com/search?q=${encodeURIComponent(userQuery)}`,
  ];

  // Use Promise.all to scrape all search engines concurrently
  const allResponses = await Promise.all(
    searchEngines.map((url) => scrapeSearchEngine(url))
  );

  // Flatten the results array
  const allResults = allResponses.flat();

  // TF-IDF scoring
  const tfidf = new TfIdf();
  allResults.forEach((item) => {
    const doc = `${item.url} ${item.description}`;
    tfidf.addDocument(doc); // Add document for scoring
  });

  const queryText = `${userQuery} ${tags.join(" ")}`;
  const rawScores = allResults.map((_, i) => tfidf.tfidf(queryText, i));

  // Normalize scores
  const maxScore = Math.max(...rawScores) || 1; // Avoid division by zero
  allResults.forEach((item, i) => {
    item.score = rawScores[i] / maxScore; // Normalize scores to scale of 0 to 1
  });

  // Sort and return the top 10 results
  return allResults
    .sort((a, b) => b.score - a.score) // Descending order by normalized score
    .slice(0, 10); // Return top 10 results
};
