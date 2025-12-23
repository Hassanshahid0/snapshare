import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { toggleTheme } = useTheme();
  return <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme" />;
};

export default ThemeToggle;
