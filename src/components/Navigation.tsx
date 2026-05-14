import { Plus, Search, House, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'recipes', label: 'Home', icon: House },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'favorites', label: 'Saved', icon: Heart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-m3-surface-variant/40 backdrop-blur-xl border-t border-m3-outline/10 pb-safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-20 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 group relative py-2 min-w-[64px]"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 -mx-4 bg-m3-secondary-container rounded-full -z-10 h-8 mt-[-4px]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  size={24}
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-m3-on-secondary-container' : 'text-m3-on-surface-variant'
                  }`}
                  fill={isActive && tab.id !== 'search' ? 'currentColor' : 'none'}
                />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? 'text-m3-on-surface font-semibold' : 'text-m3-on-surface-variant'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-m3-secondary-container text-m3-on-secondary-container rounded-2xl shadow-lg flex items-center justify-center z-40 hover:bg-m3-primary-container transition-colors"
    >
      <Plus size={24} strokeWidth={3} />
    </motion.button>
  );
}

