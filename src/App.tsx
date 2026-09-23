import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { WarehouseProvider } from './context/warehouseContext';
import './App.css';

import Home from './routes/Home';
import Sections from './routes/Sections';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/sections', element: <Sections /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WarehouseProvider>
      <RouterProvider router={router} />
    </WarehouseProvider>
  </StrictMode>
);