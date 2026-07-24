import { Suspense } from 'react';
import Categories from './categories';
import SidebarSearchInput from './search-input';
import SidebarDatePicker from './date-picker';

export default function SidebarContent() {
  return (
    <div className='space-y-6'>
      <SidebarSearchInput />
      <SidebarDatePicker />
      <div className='w-full h-[1px] bg-border' />
      <div>
        <Suspense fallback={null}>
          <Categories />
        </Suspense>
      </div>
    </div>
  );
}
