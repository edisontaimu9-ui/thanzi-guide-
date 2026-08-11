import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCourses, CourseDoc } from '@/lib/courses';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Courses() {
  useDocumentTitle('Courses');
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    listCourses()
      .then((results) => {
        setCourses(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Courses</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Short, structured lessons on nutrition and health — more are added over time.
      </p>

      <div className="mt-8">
        {status === 'loading' && (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-brand-700 dark:bg-brand-900" />
            ))}
          </div>
        )}

        {status === 'error' && <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't load courses right now.</p>}

        {status === 'idle' && courses.length === 0 && (
          <div className="rounded-lg border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-brand-700">
            <p className="font-medium text-brand-700 dark:text-sand-100">No courses yet</p>
            <p className="mt-1 text-sm">This section is still being built out.</p>
          </div>
        )}

        {status === 'idle' && courses.length > 0 && (
          <ul className="space-y-3">
            {courses.map((course) => (
              <li key={course.$id}>
                <Link
                  to={`/courses/${course.slug}`}
                  className="block rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-brand-700 dark:bg-brand-900"
                >
                  <p className="font-display text-lg text-brand-700 dark:text-sand-100">{course.title}</p>
                  {course.description && <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{course.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
