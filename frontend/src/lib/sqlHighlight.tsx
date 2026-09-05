import type { ReactNode } from "react";

// Deliberately not a real SQL tokenizer/parser - this is presentation only
// (the actual safety-relevant parsing happens server-side with sqlglot, see
// backend/app/sql_guard/validator.py). This just needs to make generated
// queries readable at a glance, not be correct on every edge case.
const KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "LEFT JOIN",
  "INNER JOIN",
  "ON",
  "GROUP BY",
  "ORDER BY",
  "LIMIT",
  "AS",
  "AND",
  "OR",
  "NOT",
  "IN",
  "IS",
  "NULL",
  "DESC",
  "ASC",
  "DISTINCT",
  "INTERVAL",
  "SUM",
  "COUNT",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
];

// Longest-first so "LEFT JOIN" matches before the bare "JOIN" alternative
// swallows part of it.
const sortedKeywords = [...KEYWORDS].sort((a, b) => b.length - a.length);
const KEYWORD_PATTERN = new RegExp(`\\b(${sortedKeywords.join("|")})\\b`, "gi");

export function highlightSql(sql: string): ReactNode[] {
  const parts = sql.split(KEYWORD_PATTERN);
  return parts.map((part, i) => {
    const isKeyword = KEYWORDS.some((kw) => kw.toLowerCase() === part.toLowerCase());
    return isKeyword ? (
      <span key={i} className="text-amber">
        {part.toUpperCase()}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}
