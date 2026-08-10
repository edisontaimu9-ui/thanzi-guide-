// Seeds one real starter course with lessons and a quiz.
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-course.mjs
// Delete the API key from the console after running.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

async function createDocument(collectionId, data) {
  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({ documentId: 'unique()', data })
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create in ${collectionId}: ${json.message || res.status}`);
  }
  return json;
}

async function main() {
  const course = await createDocument('courses', {
    title: 'Understanding Nutrition',
    slug: 'understanding-nutrition',
    description: 'A short introduction to what nutrition is and how it works.',
    status: 'published',
    order: 1
  });
  console.log(`Created course: ${course.$id}`);

  const lesson1 = await createDocument('lessons', {
    courseId: course.$id,
    title: 'What Is Nutrition?',
    slug: 'what-is-nutrition',
    order: 1,
    status: 'published',
    content: `Nutrition is the study of how the food you eat affects your body — how it gives you energy, helps you grow, and keeps your organs and systems working.

Every food is made up of nutrients: carbohydrates, protein, fat, vitamins, minerals, fiber, and water. Your body needs a mix of these in the right amounts to function well.

Good nutrition isn't about one perfect food or avoiding entire food groups. It's about eating a variety of foods regularly, so you get enough energy and the full range of nutrients your body relies on.`
  });
  console.log(`Created lesson: ${lesson1.$id}`);

  const lesson2 = await createDocument('lessons', {
    courseId: course.$id,
    title: 'Macronutrients',
    slug: 'macronutrients',
    order: 2,
    status: 'published',
    content: `Macronutrients are the nutrients your body needs in the largest amounts: carbohydrates, protein, and fat.

Carbohydrates are the body's main source of energy — found in foods like nsima, rice, and cassava. Protein builds and repairs tissue, and is found in beans, groundnuts, eggs, and fish. Fat supports energy storage and helps absorb certain vitamins, found in foods like groundnut oil and avocado.

Most meals naturally combine all three — beans and nsima together, for example, provide carbohydrates, protein, and some fat.`
  });
  console.log(`Created lesson: ${lesson2.$id}`);

  const lesson3 = await createDocument('lessons', {
    courseId: course.$id,
    title: 'Balanced Diets',
    slug: 'balanced-diets',
    order: 3,
    status: 'published',
    content: `A balanced diet means eating a variety of foods that together supply the energy and nutrients your body needs — rather than relying heavily on just one or two food types.

In practice, this often means combining staples (like nsima, rice, or cassava) with protein sources (like beans, groundnuts, fish, or eggs), vegetables, and fruit where available.

Balance looks different for different people and life stages — a growing child, a pregnant woman, and an active adult all have different needs. General guidance is a starting point; a health worker or registered dietitian can give guidance specific to your situation.`
  });
  console.log(`Created lesson: ${lesson3.$id}`);

  const quiz = await createDocument('quizzes', {
    lessonId: lesson1.$id,
    title: 'Nutrition Basics Check'
  });
  console.log(`Created quiz: ${quiz.$id}`);

  const q1 = await createDocument('questions', {
    quizId: quiz.$id,
    text: 'What are macronutrients?',
    order: 1
  });
  await createDocument('answers', { questionId: q1.$id, text: 'Carbohydrates, protein, and fat', isCorrect: true, order: 1 });
  await createDocument('answers', { questionId: q1.$id, text: 'Vitamins and minerals only', isCorrect: false, order: 2 });
  await createDocument('answers', { questionId: q1.$id, text: 'Water only', isCorrect: false, order: 3 });

  const q2 = await createDocument('questions', {
    quizId: quiz.$id,
    text: 'Why do nutrition needs differ between people?',
    order: 2
  });
  await createDocument('answers', {
    questionId: q2.$id,
    text: 'They depend on factors like age, activity level, and life stage',
    isCorrect: true,
    order: 1
  });
  await createDocument('answers', { questionId: q2.$id, text: "They don't — everyone needs the same amount", isCorrect: false, order: 2 });
  await createDocument('answers', { questionId: q2.$id, text: 'Only body weight matters', isCorrect: false, order: 3 });

  console.log('\nDone. Remember to delete the API key from the Appwrite console now.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
