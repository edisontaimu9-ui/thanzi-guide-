import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourseBySlug, listLessons, listUserProgress, CourseDoc, LessonDoc, ProgressDoc } from '@/lib/courses';
import { useAuth } from '@/lib/auth-context';

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDoc | null | undefined>(undefined);
  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [progress, setProgress] = useState<ProgressDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    if (!slug) return;
    setStatus('loading');
    getCourseBySlug(slug)
      .then(async (courseResult) => {
        setCourse(courseResult);
        if (!courseResult) {
          setStatus('idle');
          return;
        }
        const lessonResults = await listLessons(courseResult.$id);
        setLessons(lessonResults);
        if (user) {
          const progressResults = await listUserProgress(user.$id, courseResult.$id);
          setProgress(progressResults);
        }
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [slug, user]);

  const completedLessonIds = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const completedCount = lessons.filter((l) => completedLessonIds.has(l.$id)).length;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/courses" className="text-sm text-brand-500 underline">
        ← Back to courses
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 rounded bg-brand-100" />
          <div className="h-16 rounded bg-brand-100" />
        </div>
      )}

      {status === 'error' && <p className="mt-6 text-sm text-clay-500">Couldn't load this course.</p>}

      {status === 'idle' && !course && (
        <div className="mt-6 rounded-lg border border-brand-100 p-8 text-center text-brand-500">
          <p className="font-medium text-brand-700">Course not found</p>
        </div>
      )}

      {status === 'idle' && course && (
        <>
          <h1 className="mt-6 font-display text-3xl text-brand-700">{course.title}</h1>
          {course.description && <p className="mt-2 text-brand-500">{course.description}</p>}

          {user && lessons.length > 0 && (
            <p className="mt-4 text-sm font-medium text-brand-500">
              {completedCount} of {lessons.length} lessons complete
            </p>
          )}

          <ol className="mt-6 space-y-2">
            {lessons.map((lesson, i) => (
              <li key={lesson.$id}>
                <Link
                  to={`/courses/${course.slug}/${lesson.slug}`}
                  className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500"
                >
                  <span className="text-brand-700">
                    <span className="mr-2 text-brand-300">{i + 1}.</span>
                    {lesson.title}
                  </span>
                  {completedLessonIds.has(lesson.$id) && (
                    <span className="text-sm font-medium text-brand-500">✓ Done</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>

          {lessons.length === 0 && (
            <p className="mt-6 text-sm text-brand-500">Lessons for this course are still being added.</p>
          )}

          {!user && lessons.length > 0 && (
            <p className="mt-4 text-sm text-brand-500">
              <Link to="/login" className="underline">
                Sign in
              </Link>{' '}
              to track your progress through this course.
            </p>
          )}
        </>
      )}
    </main>
  );
}
