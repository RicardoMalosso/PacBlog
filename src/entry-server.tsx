import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { alternatePath, base, publicPath, routeMetadata, routes, siteUrl } from './data';
export { parseSrt, alignLyrics, activeRow, selectedRow, nearbyRow, formatTime } from './lyrics';
export { routes, alternatePath, publicPath, routeMetadata, siteUrl, base };
export function render(route: string) { return renderToString(<StaticRouter location={publicPath(route)} basename={base.replace(/\/$/, '')}><App/></StaticRouter>); }
