import { Search, X } from "lucide-react";
import type { Language } from "@/shared/utils/translator";
import { getCategoryLabel, getLabel } from "@/shared/utils/labels";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface SearchFilterProps {
  searchQuery: string;
  searchTerms: string[];
  selectedCategory: string;
  selectedCreator: string;
  categories: string[];
  creators: string[];
  currentLanguage: Language;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemoveSearchTerm: (term: string) => void;
  onCategoryChange: (value: string) => void;
  onCreatorChange: (value: string) => void;
}

export function SearchFilter({
  searchQuery,
  searchTerms,
  selectedCategory,
  selectedCreator,
  categories,
  creators,
  currentLanguage,
  onSearchChange,
  onSearchSubmit,
  onRemoveSearchTerm,
  onCategoryChange,
  onCreatorChange,
}: SearchFilterProps) {
  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Search className="h-4 w-4" />
        {getLabel("searchAndFilter", currentLanguage)}
      </h3>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
          <Input
            type="text"
            placeholder={getLabel("searchPlaceholder", currentLanguage)}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Button type="submit" variant="default">
            {getLabel("searchButton", currentLanguage)}
          </Button>
        </form>
        <div className="flex gap-2 md:flex-none">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="min-w-[180px]" aria-label={getLabel("allCategories", currentLanguage)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🍽️ {getLabel("allCategories", currentLanguage)}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {getCategoryLabel(category, currentLanguage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCreator} onValueChange={onCreatorChange}>
            <SelectTrigger className="min-w-[160px]" aria-label={getLabel("allCreators", currentLanguage)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">👨‍🍳 {getLabel("allCreators", currentLanguage)}</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator} value={creator}>
                  {creator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {searchTerms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {getLabel("activeFilters", currentLanguage)}
          </span>
          {searchTerms.map((term) => (
            <Badge key={term} variant="primary" className="gap-1.5 pr-1">
              {term}
              <button
                onClick={() => onRemoveSearchTerm(term)}
                aria-label={`Remove ${term}`}
                className="ml-0.5 rounded p-0.5 hover:bg-primary/15"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
