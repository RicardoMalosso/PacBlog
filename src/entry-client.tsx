import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './styles/global.css';
const root = document.getElementById('root')!;
const app = <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}><App/></BrowserRouter>;
if (root.childElementCount && !document.body.hasAttribute('data-not-found')) hydrateRoot(root, app); else createRoot(root).render(app);
