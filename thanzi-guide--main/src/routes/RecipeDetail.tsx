import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getRecipeBySlug, RecipeDoc } from '@/lib/recipes';

type Status = 'loading' | 'idle' | 'error';

export function RecipeDetail() {
  const { categorySlug, recipeSlug } = useParams<{ categorySlug: string; recipeSlug: string }>();
  const [recipe, setRecipe] = useState<RecipeDoc | null | undefined>(undefined);
  const [status, setStatus] = useState<Status>('loading');
  useDocumentTitle(recipe?.title);

  useEffect(() => {
    if (!recipeSlug) return;
    setStatus('loading');
    getRecipeBySlug(recipeSlug)
      .then((result) => {
        setRecipe(result);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [recipeSlug]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to={`/recipes/${categorySlug}`} className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-1/2 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="h-4 w-full rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      )}

      {status === 'error' && (
        <p className="mt-6 text-sm text-clay-500 dark:text-clay-400">Couldn't load this recipe right now.</p>
      )}

      {status === 'idle' && !recipe && <p className="mt-6 text-brand-700 dark:text-sand-100">Not found.</p>}

      {status === 'idle' && recipe && (
        <article>
          {recipe.imageUrl && (
            <img src={recipe.imageUrl} alt="" className="mt-6 h-56 w-full rounded-lg object-cover" />
          )}
          <h1 className="mt-6 font-display text-3xl text-brand-700 dark:text-sand-100">{recipe.title}</h1>
          <p className="mt-3 text-brand-500 dark:text-brand-100">{recipe.summary}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-500 dark:text-brand-100">
            {recipe.servings && <span>Serves {recipe.servings}</span>}
            {recipe.prepMinutes && <span>Prep {recipe.prepMinutes} min</span>}
            {recipe.cookMinutes && <span>Cook {recipe.cookMinutes} min</span>}
          </div>

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl text-brand-700 dark:text-sand-100">Ingredients</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-brand-900 dark:text-sand-50">
                {recipe.ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {recipe.steps && recipe.steps.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl text-brand-700 dark:text-sand-100">Steps</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-brand-900 dark:text-sand-50">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {recipe.articleSlug && (
            <Link
              to={`/learn/${recipe.articleSlug}`}
              className="mt-8 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Read the full article
            </Link>
          )}
        </article>
      )}
    </main>
  );
}
