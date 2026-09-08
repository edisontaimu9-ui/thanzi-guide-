import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listRecipeCategories, listRecipesForCategory, RecipeCategoryDoc, RecipeDoc } from '@/lib/recipes';

type Status = 'loading' | 'idle' | 'error';

export function RecipeCategoryDetail() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [category, setCategory] = useState<RecipeCategoryDoc | null | undefined>(undefined);
  const [recipes, setRecipes] = useState<RecipeDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  useDocumentTitle(category?.title);

  useEffect(() => {
    if (!categorySlug) return;
    setStatus('loading');
    Promise.all([listRecipeCategories(), listRecipesForCategory(categorySlug)])
      .then(([categories, recipeResults]) => {
        setCategory(categories.find((c) => c.slug === categorySlug) ?? null);
        setRecipes(recipeResults);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [categorySlug]);

  return (
    <main>
      {status === 'loading' && (
        <div className="mx-auto max-w-3xl animate-pulse px-6 py-12" aria-hidden="true">
          <div className="h-8 w-1/2 rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      )}

      {status === 'error' && (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't load this category right now.</p>
        </div>
      )}

      {status === 'idle' && !category && (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link to="/recipes" className="text-sm text-brand-500 underline dark:text-brand-100">
            ← Back to Recipes
          </Link>
          <p className="mt-6 text-brand-700 dark:text-sand-100">Category not found.</p>
        </div>
      )}

      {status === 'idle' && category && (
        <>
          <section className="bg-brand-500 px-6 py-12 text-white">
            <div className="mx-auto max-w-3xl">
              <Link to="/recipes" className="text-sm text-white/80 underline hover:text-white">
                ← Recipes
              </Link>
              <h1 className="mt-4 font-display text-3xl">{category.title}</h1>
              <p className="mt-4 max-w-xl text-white/90">{category.summary}</p>
            </div>
          </section>

          <div className="mx-auto max-w-3xl px-6 py-10">
            {recipes.length === 0 ? (
              <p className="text-brand-500 dark:text-brand-100">
                No {category.title.toLowerCase()} recipes yet, check back soon.
              </p>
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2">
                {recipes.map((recipe) => (
                  <li
                    key={recipe.$id}
                    className="overflow-hidden rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950"
                  >
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-sand-100 text-2xl font-display text-brand-300 dark:bg-ink-900 dark:text-brand-100">
                        {recipe.title.charAt(0)}
                      </div>
                    )}
                    <div className="p-5">
                      <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">{recipe.title}</h2>
                      <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">{recipe.summary}</p>
                      <Link
                        to={`/recipes/${category.slug}/${recipe.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
                      >
                        View Recipe
                        <span aria-hidden="true">›</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
