import { Suspense } from 'react';
import Categories from './categories';
import SidebarSearchInput from './search-input';
import SidebarDatePicker from './date-picker';

export default function SidebarContent() {
  return (
    // MUI DateCalendarの余白を打ち消す負のmarginと併用するため、space-y-*ではなくgapを使う。
    // v4のspace-y-*は「最後以外の子のmargin-bottom」で実装されており、子が持つ
    // `-mb-*`ユーティリティに上書きされて間隔が消えてしまう(v3は次の兄弟のmargin-top)。
    <div className='rad:flex rad:flex-col rad:gap-6'>
      <SidebarSearchInput />
      <SidebarDatePicker />
      <div className='rad:w-full rad:h-px rad:shrink-0 rad:bg-border' />
      <div>
        <Suspense fallback={null}>
          <Categories />
        </Suspense>
      </div>
    </div>
  );
}
