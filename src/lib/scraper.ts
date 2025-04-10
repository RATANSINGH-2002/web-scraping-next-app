import axios from "axios";
import * as cheerio from "cheerio";
import stringSimilarity from "string-similarity";

interface SearchResult {
  url: string;
  description: string;
  score: number;
}

function keywordMatchBoost(text: string, keywords: string[]): number {
  const lowered = text.toLowerCase();
  const matches = keywords.filter(k => lowered.includes(k.toLowerCase()));
  return matches.length / keywords.length;
}

export const scrapeAndRank = async (
  query: string,
  tags: string[]
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

  const searchQuery = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${searchQuery}`;

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const inputText = `${query} ${tags.join(" ")}`.toLowerCase();
  const allKeywords = inputText.split(" ").filter(Boolean);

  $("li.b_algo").each((_, el) => {
    const title = $(el).find("h2").text() || "";
    const link = $(el).find("h2 a").attr("href") || "";
    const desc = $(el).find(".b_caption p").text() || "";

    const combinedText = `${title} ${desc} ${link}`.toLowerCase();

    // 60% string similarity, 40% keyword match boost
    const stringSimScore = stringSimilarity.compareTwoStrings(combinedText, inputText);
    const keywordBoost = keywordMatchBoost(combinedText, allKeywords);

    const finalScore = (0.6 * stringSimScore) + (0.4 * keywordBoost);

    results.push({
      url: link,
      description: desc,
      score: finalScore,
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
};
