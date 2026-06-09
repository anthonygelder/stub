import { Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { NewStubPage } from './pages/NewStubPage';
import { FeedPage } from './pages/FeedPage';
import { ImportPage } from './pages/ImportPage';
import { ImportReviewPage } from './pages/ImportReviewPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/new" element={<NewStubPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/:handle" element={<ProfilePage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/import/review" element={<ImportReviewPage />} />
      </Routes>
    </>
  );
}
