import { Search, X } from "lucide-react";
import type { Language } from "@/shared/utils/translator";
import { getCategoryLabel, getLabel } from "@/shared/utils/labels";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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
    <section className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm md:mb-6 md:p-5">
      <form onSubmit={onSearchSubmit} className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={getLabel("searchPlaceholder", currentLanguage)}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="submit"
          aria-label={getLabel("searchButton", currentLanguage)}
          title={getLabel("searchButton", currentLanguage)}
          className="px-3 sm:px-5"
        >
          <Search className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">{getLabel("searchButton", currentLanguage)}</span>
        </Button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="flex-1" aria-label={getLabel("allCategories", currentLanguage)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getLabel("allCategories", currentLanguage)}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryLabel(category, currentLanguage)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCreator} onValueChange={onCreatorChange}>
          <SelectTrigger className="flex-1" aria-label={getLabel("allCreators", currentLanguage)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getLabel("allCreators", currentLanguage)}</SelectItem>
            {creators.map((creator) => (
              <SelectItem key={creator} value={creator}>
                {creator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {searchTerms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {getLabel("activeFilters", currentLanguage)}
          </span>
          {searchTerms.map((term) => (
            <Badge key={term} variant="primary" className="gap-1.5 pr-1.5">
              {term}
              <button
                onClick={() => onRemoveSearchTerm(term)}
                aria-label={`Remove ${term}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
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
