"use client";

import { useCallback, useMemo, useState } from "react";

export function useContactSearch(activeTab) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const usersToDisplay = useMemo(() => {
    if (activeTab !== "contacts" || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [activeTab, searchTerm, searchResults]);

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults([]);
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    usersToDisplay,
    resetSearch,
    handleSearchChange,
  };
}
