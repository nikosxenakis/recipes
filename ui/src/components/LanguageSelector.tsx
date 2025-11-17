import React from 'react';
import { LANGUAGES, type Language } from '../utils/translator';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => {
  const handleChange = (newLang: Language) => {
    onLanguageChange(newLang);
    // Reload page to apply new language
    window.location.reload();
  };

  const currentLangData = LANGUAGES.find(lang => lang.code === currentLanguage);

  return (
    <div className="language-selector">
      <label htmlFor="language-select" className="language-label">
        {currentLangData?.flag || '🌍'}
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => handleChange(e.target.value as Language)}
        className="language-select"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
