import type { ReactNode } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultIndex?: number;
  className?: string;
}

export default function Tabs({ items, defaultIndex = 0, className = '' }: TabsProps) {
  return (
    <TabGroup defaultIndex={defaultIndex} className={className}>
      <TabList className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {items.map((item) => (
          <Tab
            key={item.id}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 transition focus:outline-none data-hover:text-slate-900 data-selected:bg-white data-selected:text-primary-600 data-selected:shadow-xs dark:text-slate-400 dark:data-hover:text-white dark:data-selected:bg-slate-800 dark:data-selected:text-primary-400 sm:text-sm"
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {item.badge}
              </span>
            )}
          </Tab>
        ))}
      </TabList>

      <TabPanels className="mt-4">
        {items.map((item) => (
          <TabPanel key={item.id} className="focus:outline-none">
            {item.content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}