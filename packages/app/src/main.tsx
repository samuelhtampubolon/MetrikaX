import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles/app.css';

const container = document.getElementById('root');
if (container === null) throw new Error('The root element is missing from index.html.');

const root = createRoot(container);

/**
 * The component gallery is a development aid reached at #gallery.
 *
 * `import.meta.env.DEV` is a compile-time constant, so in a production build this branch is dead
 * and the dynamic import is dropped: the gallery costs the shipped bundle nothing, which is what
 * the total decorative asset budget of zero files requires.
 */
if (import.meta.env.DEV && window.location.hash === '#gallery') {
  void import('./screens/Gallery.tsx').then(({ Gallery }) => {
    root.render(
      <StrictMode>
        <Gallery />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
