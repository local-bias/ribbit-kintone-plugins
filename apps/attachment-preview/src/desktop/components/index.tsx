import { Provider, store } from '@repo/jotai';
import Drawer from './drawer';

export default function App() {
  return (
    <Provider store={store}>
      <Drawer />
    </Provider>
  );
}
