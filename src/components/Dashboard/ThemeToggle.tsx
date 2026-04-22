import { Sun, Moon } from 'lucide-react';
import { Theme } from '../../types/student';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className="bg-[#2d3142] border-2 border-[#6358cc]/30 rounded-xl p-3 hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-[#6358cc]/30"
      title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6 text-[#ff9f43]" />
      ) : (
        <Moon className="w-6 h-6 text-[#6358cc]" />
      )}
    </button>
  );
};



