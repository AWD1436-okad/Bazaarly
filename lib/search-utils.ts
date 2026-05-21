export function tokenizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normalizeSearchText(value: string) {
  return tokenizeSearchText(value).join(" ");
}

export function getSearchTokenVariants(token: string) {
  const variants = new Set([token]);

  if (token.endsWith("ies") && token.length > 4) {
    variants.add(`${token.slice(0, -3)}y`);
  }

  if (token.endsWith("es") && token.length > 3) {
    variants.add(token.slice(0, -2));
  }

  if (token.endsWith("s") && token.length > 3) {
    variants.add(token.slice(0, -1));
  }

  return Array.from(variants);
}

export function buildSearchHaystack(values: string[]) {
  const normalizedValues = values.map(normalizeSearchText).filter(Boolean);
  const tokens = Array.from(new Set(normalizedValues.flatMap(tokenizeSearchText)));

  return {
    normalizedValues,
    tokens,
    expandedTokens: Array.from(new Set(tokens.flatMap(getSearchTokenVariants))),
  };
}

export function textMatchesSearch(query: string, values: string[]) {
  const queryTokens = tokenizeSearchText(query);
  if (queryTokens.length === 0) return true;

  const haystack = buildSearchHaystack(values);
  const joinedValues = haystack.normalizedValues.join(" ");

  return queryTokens.every((token) => {
    const variants = getSearchTokenVariants(token);
    return variants.some(
      (variant) =>
        joinedValues.includes(variant) ||
        haystack.expandedTokens.some(
          (searchableToken) => searchableToken.includes(variant) || variant.includes(searchableToken),
        ),
    );
  });
}
