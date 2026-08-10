import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/routes/Home';
import { Login } from '@/routes/Login';
import { Signup } from '@/routes/Signup';
import { Dashboard } from '@/routes/Dashboard';
import { Foods } from '@/routes/Foods';
import { FoodDetail } from '@/routes/FoodDetail';
import { Articles } from '@/routes/Articles';
import { ArticleDetail } from '@/routes/ArticleDetail';
import { Courses } from '@/routes/Courses';
import { CourseDetail } from '@/routes/CourseDetail';
import { Lesson } from '@/routes/Lesson';
import { Search } from '@/routes/Search';
import { ComingSoon } from '@/routes/ComingSoon';
import { NotFound } from '@/routes/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/foods" element={<Foods />} />
            <Route path="/foods/:id" element={<FoodDetail />} />
            <Route path="/learn" element={<Articles />} />
            <Route path="/learn/:slug" element={<ArticleDetail />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/courses/:courseSlug/:lessonSlug" element={<Lesson />} />
            <Route path="/search" element={<Search />} />
            <Route
              path="/tools"
              element={
                <ComingSoon
                  title="Tools"
                  description="A BMI calculator and energy estimator are on the way — both will clearly explain that they give estimates, not diagnoses."
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
