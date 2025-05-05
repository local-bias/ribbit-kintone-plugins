import { store } from '@repo/jotai';
import { Provider } from 'jotai';
import Drawer from './drawer';

export default function App() {
  return (
    <Provider store={store}>
      <Drawer />
    </Provider>
  );
}
