import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminRoute } from '@/components/layout/AdminRoute';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/routes/Home';
import { Login } from '@/routes/Login';
import { Signup } from '@/routes/Signup';
import { Dashboard } from '@/routes/Dashboard';
import { Settings } from '@/routes/Settings';
import { Foods } from '@/routes/Foods';
import { Health } from '@/routes/Health';
import { HealthTopicDetail } from '@/routes/HealthTopicDetail';
import { HealthSubtopicDetail } from '@/routes/HealthSubtopicDetail';
import { FoodDetail } from '@/routes/FoodDetail';
import { Articles } from '@/routes/Articles';
import { ArticleDetail } from '@/routes/ArticleDetail';
import { Courses } from '@/routes/Courses';
import { CourseDetail } from '@/routes/CourseDetail';
import { Lesson } from '@/routes/Lesson';
import { Search } from '@/routes/Search';
import { Tools } from '@/routes/Tools';
import { ComingSoon } from '@/routes/ComingSoon';
import { Support } from '@/routes/Support';
import { Care } from '@/routes/Care';
import { ProviderDetail } from '@/routes/ProviderDetail';
import { Partner } from '@/routes/Partner';
import { Terms } from '@/routes/Terms';
import { Privacy } from '@/routes/Privacy';
import { CookiePolicy } from '@/routes/CookiePolicy';
import { BmiCalculator } from '@/routes/BmiCalculator';
import { EnergyEstimator } from '@/routes/EnergyEstimator';
import { Admin } from '@/routes/Admin';
import { NotFound } from '@/routes/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/foods" element={<Foods />} />
              <Route path="/foods/:id" element={<FoodDetail />} />
              <Route path="/health" element={<Health />} />
              <Route path="/health/:topicSlug" element={<HealthTopicDetail />} />
              <Route path="/health/:topicSlug/:subtopicSlug" element={<HealthSubtopicDetail />} />
              <Route path="/learn" element={<Articles />} />
              <Route path="/learn/:slug" element={<ArticleDetail />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/courses/:courseSlug/:lessonSlug" element={<Lesson />} />
              <Route path="/search" element={<Search />} />
              <Route
                path="/ask"
                element={
                  <ComingSoon
                    title="Ask"
                    description="A place to ask health and nutrition questions and get answers grounded in Thanzi Guide's own content. It's on the way, once the food and article database has enough real content to ground it in."
                  />
                }
              />
              <Route
                path="/recipes"
                element={
                  <ComingSoon
                    title="Recipes"
                    description="Malawian recipes built from the food database, with the same nutrition breakdown you see on food pages. Coming once we have enough dishes written and reviewed."
                  />
                }
              />
              <Route
                path="/fitness"
                element={
                  <ComingSoon
                    title="Fitness"
                    description="Activity and exercise guidance to go with the BMI and energy tools — walking, home workouts, and safe activity levels for common conditions."
                  />
                }
              />
              <Route
                path="/women"
                element={
                  <ComingSoon
                    title="For Women"
                    description="Nutrition and health guidance through pregnancy, breastfeeding, and beyond, gathered in one place as more articles are reviewed."
                  />
                }
              />
              <Route
                path="/men"
                element={
                  <ComingSoon
                    title="For Men"
                    description="Nutrition and health topics for men, gathered in one place as more articles are reviewed."
                  />
                }
              />
              <Route
                path="/kids"
                element={
                  <ComingSoon
                    title="For Kids"
                    description="Feeding guidance for infants, children, and growing families, gathered in one place as more articles are reviewed."
                  />
                }
              />
              <Route
                path="/seniors"
                element={
                  <ComingSoon
                    title="For Seniors"
                    description="Nutrition guidance for healthy ageing, gathered in one place as more articles are reviewed."
                  />
                }
              />
              <Route
                path="/about"
                element={
                  <ComingSoon
                    title="About Thanzi Guide"
                    description="Who's behind Thanzi Guide, and how the content is written and reviewed. This page is on the way."
                  />
                }
              />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/bmi" element={<BmiCalculator />} />
              <Route path="/tools/energy" element={<EnergyEstimator />} />
              <Route path="/support" element={<Support />} />
              <Route path="/care" element={<Care />} />
              <Route path="/care/:id" element={<ProviderDetail />} />
              <Route path="/partner" element={<Partner />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
