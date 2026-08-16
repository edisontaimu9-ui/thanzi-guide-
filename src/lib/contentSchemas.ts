// Describes every content type editable from the Content Manager, so one
// generic list view and one generic form can drive all of them instead of
// hand-building a page per type. Add a new content type here and it shows
// up in the panel automatically — no new components needed.

export type FieldType = 'text' | 'textarea' | 'number' | 'lines' | 'select' | 'image' | 'file' | 'boolean';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  options?: string[];
  defaultValue?: string;
  bucketId?: string;
  // For 'file' fields: the key of a sibling text field to auto-fill with
  // the uploaded file's original name (so it can be shown/downloaded with
  // a readable name instead of just the storage file id).
  pairedNameKey?: string;
}

export interface ContentSchema {
  key: string;
  label: string;
  collectionId: string;
  titleField: string;
  fields: FieldSchema[];
  // Set for content types that already use their own `status` field with
  // different meaning (e.g. providers: active/inactive, not draft/
  // published). When true, the generic draft/publish workflow is skipped
  // entirely — status becomes a normal editable field instead.
  manageOwnStatus?: boolean;
  // Set when create/update on the underlying collection is restricted to
  // label:admin in Appwrite (rather than the usual label:editor). The
  // Content Manager still lists this type for editors/nutrition experts,
  // but the create/edit form is hidden for non-admins to avoid a
  // confusing permission error from the API.
  adminOnly?: boolean;
}

export const CONTENT_SCHEMAS: ContentSchema[] = [
  {
    key: 'articles',
    label: 'Articles',
    collectionId: 'articles',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'body', label: 'Body', type: 'textarea', required: true },
      { key: 'categoryId', label: 'Category ID', type: 'text' },
      { key: 'featuredImage', label: 'Featured image URL', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'lines', helpText: 'One tag per line' },
      { key: 'sources', label: 'Sources', type: 'lines', helpText: 'One source per line' }
    ]
  },
  {
    key: 'foods',
    label: 'Foods',
    collectionId: 'foods',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'categoryId', label: 'Category ID', type: 'text' },
      { key: 'servingSize', label: 'Serving size', type: 'text' },
      { key: 'calories', label: 'Calories', type: 'number' },
      { key: 'protein', label: 'Protein (g)', type: 'number' },
      { key: 'carbs', label: 'Carbs (g)', type: 'number' },
      { key: 'fat', label: 'Fat (g)', type: 'number' },
      { key: 'fiber', label: 'Fiber (g)', type: 'number' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'localNames', label: 'Local names', type: 'lines', helpText: 'One name per line' },
      { key: 'preparationMethods', label: 'Preparation methods', type: 'lines', helpText: 'One method per line' },
      { key: 'sources', label: 'Sources', type: 'lines', helpText: 'One source per line' }
    ]
  },
  {
    key: 'courses',
    label: 'Courses',
    collectionId: 'courses',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'coverImage', label: 'Cover image URL', type: 'text' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'health-topics',
    label: 'Health Topics',
    collectionId: 'health_topics',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'body', label: 'Body', type: 'textarea', required: true },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'articleIds', label: 'Article IDs', type: 'lines', helpText: 'One article $id per line' }
    ]
  },
  {
    key: 'health-subtopics',
    label: 'Health Subtopic Cards',
    collectionId: 'health_subtopics',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'parentSlug', label: 'Parent topic slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'articleSlug', label: 'Linked article slug', type: 'text' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'fitness-topics',
    label: 'Fitness Topics',
    collectionId: 'fitness_topics',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'body', label: 'Body', type: 'textarea', required: true },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'articleIds', label: 'Article IDs', type: 'lines', helpText: 'One article $id per line' }
    ]
  },
  {
    key: 'fitness-subtopics',
    label: 'Fitness Subtopic Cards',
    collectionId: 'fitness_subtopics',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'parentSlug', label: 'Parent topic slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'articleSlug', label: 'Linked article slug', type: 'text' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'recipe-categories',
    label: 'Recipe Categories',
    collectionId: 'recipe_categories',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'recipes',
    label: 'Recipes',
    collectionId: 'recipes',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'categorySlug', label: 'Category slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'servings', label: 'Servings', type: 'number' },
      { key: 'prepMinutes', label: 'Prep minutes', type: 'number' },
      { key: 'cookMinutes', label: 'Cook minutes', type: 'number' },
      { key: 'ingredients', label: 'Ingredients', type: 'lines', helpText: 'One ingredient per line' },
      { key: 'steps', label: 'Steps', type: 'lines', helpText: 'One step per line' },
      { key: 'articleSlug', label: 'Linked article slug', type: 'text' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'kids-stages',
    label: 'Kids Stage Cards',
    collectionId: 'kids_stages',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'articleIds', label: 'Article IDs', type: 'lines', helpText: 'One article $id per line' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'providers',
    label: 'Providers',
    collectionId: 'providers',
    titleField: 'name',
    manageOwnStatus: true,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true, helpText: 'e.g. Registered Dietitian' },
      { key: 'specialty', label: 'Specialty', type: 'text' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
      { key: 'photoUrl', label: 'Photo', type: 'image', bucketId: 'food_images' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['active', 'inactive'],
        defaultValue: 'active',
        helpText: 'Only "active" providers are bookable and visible to patients'
      },
      {
        key: 'claimEmail',
        label: 'Claim email',
        type: 'text',
        helpText: 'The email this provider will sign up with — lets them auto-link via "Claim your profile" instead of you setting the User ID manually'
      },
      {
        key: 'userId',
        label: 'Linked login (User ID)',
        type: 'text',
        helpText: 'Set automatically once claimed. Only edit this by hand if you need to override it.'
      }
    ]
  },
  {
    key: 'categories',
    label: 'Categories',
    collectionId: 'categories',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: ['article', 'food', 'course'],
        helpText: 'Which content type this category is used for'
      },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  {
    key: 'lessons',
    label: 'Lessons',
    collectionId: 'lessons',
    titleField: 'title',
    fields: [
      { key: 'courseId', label: 'Course ID', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'content', label: 'Content', type: 'textarea', required: true },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    collectionId: 'quizzes',
    titleField: 'title',
    fields: [
      { key: 'lessonId', label: 'Lesson ID', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text' }
    ]
  },
  {
    key: 'questions',
    label: 'Quiz Questions',
    collectionId: 'questions',
    titleField: 'text',
    fields: [
      { key: 'quizId', label: 'Quiz ID', type: 'text', required: true },
      { key: 'text', label: 'Question text', type: 'textarea', required: true },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'answers',
    label: 'Quiz Answers',
    collectionId: 'answers',
    titleField: 'text',
    fields: [
      { key: 'questionId', label: 'Question ID', type: 'text', required: true },
      { key: 'text', label: 'Answer text', type: 'text', required: true },
      { key: 'isCorrect', label: 'Correct answer', type: 'boolean' },
      { key: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'references',
    label: 'References',
    collectionId: 'references',
    titleField: 'title',
    adminOnly: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'url', label: 'URL', type: 'text', helpText: 'External link, if this reference points off-site' },
      {
        key: 'fileId',
        label: 'Attached file',
        type: 'file',
        bucketId: 'food_images',
        pairedNameKey: 'fileName',
        helpText: 'PDF, DOCX, TXT, CSV, image, or video, up to 100MB — visible to all users to view and download. Admin only.'
      },
      { key: 'fileName', label: 'File name', type: 'text', helpText: 'Auto-filled from the uploaded file' },
      { key: 'publisher', label: 'Publisher', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'relatedType', label: 'Related content type', type: 'text', helpText: 'e.g. "article" or "food"' },
      { key: 'relatedId', label: 'Related content ID', type: 'text' }
    ]
  },
  {
    key: 'life-stage-pages',
    label: 'Life Stage Pages (Women/Men/Seniors)',
    collectionId: 'life_stage_pages',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true, helpText: 'e.g. women, men, seniors' },
      { key: 'intro', label: 'Intro', type: 'textarea', required: true },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'articleIds', label: 'Article IDs', type: 'lines', helpText: 'One article $id per line' }
    ]
  }
];

export function getContentSchema(key: string): ContentSchema | undefined {
  return CONTENT_SCHEMAS.find((s) => s.key === key);
}
