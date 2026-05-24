import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Language } from '../utils/translator';
import { getLabel } from '../utils/labels';
import './CreateRecipeModal.css';

interface IngredientSectionDraft {
  title: string;
  items: string;
}

interface DraftRecipe {
  title: string;
  category: string;
  creator: string;
  duration: string;
  servings: string;
  difficulty: '' | 'einfach' | 'mittel' | 'schwer';
  tags: string;
  photo: string;
  ingredients: IngredientSectionDraft[];
  instructions: string;
  tips: string;
  info: string;
}

const emptyDraft = (): DraftRecipe => ({
  title: '',
  category: '',
  creator: '',
  duration: '',
  servings: '',
  difficulty: '',
  tags: '',
  photo: '',
  ingredients: [{ title: '', items: '' }],
  instructions: '',
  tips: '',
  info: ''
});

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function csvToArray(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface CreateRecipeModalProps {
  onClose: () => void;
  onCreated: (recipeId: string) => void;
  categories: string[];
  creators: string[];
  currentLanguage: Language;
}

export function CreateRecipeModal({
  onClose,
  onCreated,
  categories,
  creators,
  currentLanguage
}: CreateRecipeModalProps) {
  const [draft, setDraft] = useState<DraftRecipe>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = <K extends keyof DraftRecipe>(key: K, value: DraftRecipe[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateIngredient = (index: number, field: keyof IngredientSectionDraft, value: string) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const addIngredientSection = () => {
    setDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, { title: '', items: '' }] }));
  };

  const removeIngredientSection = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.length === 1
        ? prev.ingredients
        : prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const buildPayload = () => {
    const ingredients = draft.ingredients
      .map((section) => ({
        title: section.title.trim() || undefined,
        items: linesToArray(section.items)
      }))
      .filter((section) => section.items.length > 0 || section.title);

    const instructions = linesToArray(draft.instructions);
    const tips = linesToArray(draft.tips);
    const info = linesToArray(draft.info);
    const tags = csvToArray(draft.tags);

    return {
      title: draft.title.trim(),
      category: draft.category.trim(),
      creator: draft.creator.trim() ? { name: draft.creator.trim() } : undefined,
      duration: draft.duration.trim() || undefined,
      servings: draft.servings.trim() || undefined,
      difficulty: draft.difficulty || undefined,
      tags: tags.length > 0 ? tags : undefined,
      photo: draft.photo.trim() || undefined,
      ingredients,
      instructions,
      tips: tips.length > 0 ? tips : undefined,
      info: info.length > 0 ? info : undefined
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = buildPayload();
    if (!payload.title) {
      setError('Title is required.');
      setSubmitting(false);
      return;
    }
    if (!payload.category) {
      setError('Category is required.');
      setSubmitting(false);
      return;
    }
    if (payload.ingredients.length === 0 || payload.ingredients.every((s) => s.items.length === 0)) {
      setError('At least one ingredient is required.');
      setSubmitting(false);
      return;
    }
    if (payload.instructions.length === 0) {
      setError('At least one instruction step is required.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { recipe?: { id: string }; error?: string };
      if (!response.ok) {
        setError(data.error ?? `Failed to save (HTTP ${response.status})`);
        setSubmitting(false);
        return;
      }
      const recipeId = data.recipe?.id ?? '';
      onCreated(recipeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="create-recipe-backdrop" onClick={handleBackdropClick}>
      <div className="create-recipe-modal" role="dialog" aria-modal="true" aria-labelledby="create-recipe-title" ref={dialogRef}>
        <div className="create-recipe-header">
          <h2 id="create-recipe-title">{getLabel('addRecipe', currentLanguage)}</h2>
          <button type="button" className="create-recipe-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="create-recipe-form" onSubmit={handleSubmit}>
          <div className="create-recipe-grid">
            <label className="create-recipe-field create-recipe-field-wide">
              <span>Title *</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                required
                maxLength={200}
              />
            </label>

            <label className="create-recipe-field">
              <span>Category *</span>
              <input
                type="text"
                list="modal-category-list"
                value={draft.category}
                onChange={(e) => update('category', e.target.value)}
                required
              />
              <datalist id="modal-category-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>

            <label className="create-recipe-field">
              <span>Creator</span>
              <input
                type="text"
                list="modal-creator-list"
                value={draft.creator}
                onChange={(e) => update('creator', e.target.value)}
              />
              <datalist id="modal-creator-list">
                {creators.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>

            <label className="create-recipe-field">
              <span>Duration</span>
              <input
                type="text"
                placeholder="z.B. 30 Minuten"
                value={draft.duration}
                onChange={(e) => update('duration', e.target.value)}
              />
            </label>

            <label className="create-recipe-field">
              <span>Servings</span>
              <input
                type="text"
                placeholder="z.B. 4 Personen"
                value={draft.servings}
                onChange={(e) => update('servings', e.target.value)}
              />
            </label>

            <label className="create-recipe-field">
              <span>Difficulty</span>
              <select
                value={draft.difficulty}
                onChange={(e) => update('difficulty', e.target.value as DraftRecipe['difficulty'])}
              >
                <option value="">—</option>
                <option value="einfach">einfach</option>
                <option value="mittel">mittel</option>
                <option value="schwer">schwer</option>
              </select>
            </label>

            <label className="create-recipe-field">
              <span>Tags (comma separated)</span>
              <input
                type="text"
                value={draft.tags}
                onChange={(e) => update('tags', e.target.value)}
              />
            </label>

            <label className="create-recipe-field create-recipe-field-wide">
              <span>Photo URL</span>
              <input
                type="url"
                placeholder="https://..."
                value={draft.photo}
                onChange={(e) => update('photo', e.target.value)}
              />
            </label>
          </div>

          <fieldset className="create-recipe-fieldset">
            <legend>{getLabel('ingredients', currentLanguage)} *</legend>
            {draft.ingredients.map((section, index) => (
              <div key={index} className="ingredient-section-draft">
                <div className="ingredient-section-header">
                  <input
                    type="text"
                    className="ingredient-section-title"
                    placeholder="Section title (optional, e.g. 'Für die Sauce')"
                    value={section.title}
                    onChange={(e) => updateIngredient(index, 'title', e.target.value)}
                  />
                  {draft.ingredients.length > 1 && (
                    <button
                      type="button"
                      className="create-recipe-remove"
                      onClick={() => removeIngredientSection(index)}
                      aria-label={`Remove section ${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="One ingredient per line"
                  rows={4}
                  value={section.items}
                  onChange={(e) => updateIngredient(index, 'items', e.target.value)}
                />
              </div>
            ))}
            <button type="button" className="create-recipe-add-section" onClick={addIngredientSection}>
              + Section
            </button>
          </fieldset>

          <label className="create-recipe-field create-recipe-field-wide">
            <span>{getLabel('instructions', currentLanguage)} * (one step per line)</span>
            <textarea
              rows={6}
              value={draft.instructions}
              onChange={(e) => update('instructions', e.target.value)}
              required
            />
          </label>

          <label className="create-recipe-field create-recipe-field-wide">
            <span>{getLabel('tips', currentLanguage)} (one per line)</span>
            <textarea
              rows={3}
              value={draft.tips}
              onChange={(e) => update('tips', e.target.value)}
            />
          </label>

          <label className="create-recipe-field create-recipe-field-wide">
            <span>{getLabel('info', currentLanguage)} (one per line, e.g. 'Quelle: ...')</span>
            <textarea
              rows={3}
              value={draft.info}
              onChange={(e) => update('info', e.target.value)}
            />
          </label>

          {error && <div className="create-recipe-error" role="alert">{error}</div>}

          <div className="create-recipe-actions">
            <button type="button" className="create-recipe-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="create-recipe-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
