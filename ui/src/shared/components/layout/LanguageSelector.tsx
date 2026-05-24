import { LANGUAGES, type Language } from "@/shared/utils/translator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";

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
      <SelectTrigger
        aria-label={`Language: ${current?.name ?? currentLanguage}`}
        className="h-12 w-14 justify-center px-0 [&>svg]:hidden"
      >
        <span className="text-2xl leading-none" aria-hidden>{current?.flag ?? "🌍"}</span>
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="mr-2 text-xl" aria-hidden>{lang.flag}</span>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
