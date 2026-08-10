import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCourseBySlug,
  getLessonBySlug,
  getQuizForLesson,
  listQuestions,
  listAnswers,
  markLessonComplete,
  listUserProgress,
  CourseDoc,
  LessonDoc,
  QuizDoc,
  QuestionDoc,
  AnswerDoc
} from '@/lib/courses';
import { useAuth } from '@/lib/auth-context';

interface QuestionWithAnswers extends QuestionDoc {
  answers: AnswerDoc[];
}

export function Lesson() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [lesson, setLesson] = useState<LessonDoc | null>(null);
  const [quiz, setQuiz] = useState<QuizDoc | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [alreadyComplete, setAlreadyComplete] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!courseSlug || !lessonSlug) return;
    setStatus('loading');
    setQuizChecked(false);
    setSelectedAnswers({});

    (async () => {
      const courseResult = await getCourseBySlug(courseSlug);
      if (!courseResult) {
        setCourse(null);
        setStatus('idle');
        return;
      }
      setCourse(courseResult);

      const lessonResult = await getLessonBySlug(courseResult.$id, lessonSlug);
      setLesson(lessonResult);
      if (!lessonResult) {
        setStatus('idle');
        return;
      }

      if (user) {
        const progress = await listUserProgress(user.$id, courseResult.$id);
        setAlreadyComplete(progress.some((p) => p.lessonId === lessonResult.$id && p.completed));
      }

      const quizResult = await getQuizForLesson(lessonResult.$id);
      setQuiz(quizResult);
      if (quizResult) {
        const questionResults = await listQuestions(quizResult.$id);
        const withAnswers = await Promise.all(
          questionResults.map(async (q) => ({ ...q, answers: await listAnswers(q.$id) }))
        );
        setQuestions(withAnswers);
      } else {
        setQuestions([]);
      }

      setStatus('idle');
    })().catch(() => setStatus('error'));
  }, [courseSlug, lessonSlug, user]);

  async function handleMarkComplete() {
    if (!user || !course || !lesson) return;
    setMarking(true);
    try {
      await markLessonComplete(user.$id, course.$id, lesson.$id);
      setAlreadyComplete(true);
    } finally {
      setMarking(false);
    }
  }

  const allCorrect =
    questions.length > 0 &&
    questions.every((q) => {
      const correctAnswer = q.answers.find((a) => a.isCorrect);
      return correctAnswer && selectedAnswers[q.$id] === correctAnswer.$id;
    });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {course && (
        <Link to={`/courses/${course.slug}`} className="text-sm text-brand-500 underline">
          ← Back to {course.title}
        </Link>
      )}

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 rounded bg-brand-100" />
          <div className="h-24 rounded bg-brand-100" />
        </div>
      )}

      {status === 'error' && <p className="mt-6 text-sm text-clay-500">Couldn't load this lesson.</p>}

      {status === 'idle' && (!course || !lesson) && (
        <div className="mt-6 rounded-lg border border-brand-100 p-8 text-center text-brand-500">
          <p className="font-medium text-brand-700">Lesson not found</p>
        </div>
      )}

      {status === 'idle' && course && lesson && (
        <>
          <h1 className="mt-6 font-display text-3xl text-brand-700">{lesson.title}</h1>

          <div className="prose prose-brand mt-6 max-w-none space-y-4 text-brand-900">
            {lesson.content.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {questions.length > 0 && (
            <section className="mt-10 border-t border-brand-100 pt-6">
              <h2 className="font-display text-lg text-brand-700">Quick check</h2>
              <div className="mt-4 space-y-6">
                {questions.map((q) => (
                  <div key={q.$id}>
                    <p className="font-medium text-brand-700">{q.text}</p>
                    <div className="mt-2 space-y-2">
                      {q.answers.map((a) => {
                        const selected = selectedAnswers[q.$id] === a.$id;
                        const showResult = quizChecked;
                        const isRight = a.isCorrect;
                        return (
                          <button
                            key={a.$id}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [q.$id]: a.$id }))
                            }
                            className={`block w-full rounded-md border px-4 py-2 text-left text-sm ${
                              showResult && isRight
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : showResult && selected && !isRight
                                  ? 'border-clay-500 bg-clay-400/10 text-clay-500'
                                  : selected
                                    ? 'border-brand-500 text-brand-700'
                                    : 'border-brand-100 text-brand-700'
                            }`}
                          >
                            {a.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setQuizChecked(true)}
                className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white"
              >
                Check answers
              </button>
              {quizChecked && (
                <p className="mt-3 text-sm font-medium text-brand-700">
                  {allCorrect ? 'All correct!' : 'Review the highlighted answers above.'}
                </p>
              )}
            </section>
          )}

          <div className="mt-10 border-t border-brand-100 pt-6">
            {!user ? (
              <p className="text-sm text-brand-500">
                <Link to="/login" className="underline">
                  Sign in
                </Link>{' '}
                to track completion of this lesson.
              </p>
            ) : alreadyComplete ? (
              <p className="text-sm font-medium text-brand-700">✓ Lesson complete</p>
            ) : (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={marking}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {marking ? 'Marking...' : 'Mark lesson complete'}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
