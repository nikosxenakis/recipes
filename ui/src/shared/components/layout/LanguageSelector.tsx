import { LANGUAGES, type Language } from "@/shared/utils/translator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const handleChange = (next: string) => {
    onLanguageChange(next as Language);
    window.location.reload();
  };

  const current = LANGUAGES.find((lang) => lang.code === currentLanguage);

  return (
    <Select value={currentLanguage} onValueChange={handleChange}>
      <SelectTrigger className="w-auto gap-2 px-3" aria-label="Language">
        <span aria-hidden>{current?.flag ?? "🌍"}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="mr-2" aria-hidden>{lang.flag}</span>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
