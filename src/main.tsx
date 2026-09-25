import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { WarehouseProvider } from './context/warehouseContext';
import './App.css';

import Home from './routes/Home';
import Sections from './routes/Sections';
import Meds from './routes/Meds';
import SectionDetail from './routes/SectionDetail';
import FloorDetail from './routes/FloorDetail';
import ProductDetail from './routes/ProductDetail';
import Historyscreen from './routes/History';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/sections', element: <Sections /> },
  { path: '/meds', element: <Meds /> },
  { path: '/sections/history', element: <Historyscreen /> },
  { path: '/sections/:sectionId', element: <SectionDetail /> },
  { path: '/sections/:sectionId/:floorId', element: <FloorDetail /> },
  { path: '/sections/:sectionId/:floorId/:productId', element: <ProductDetail /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WarehouseProvider>
      <RouterProvider router={router} />
    </WarehouseProvider>
  </StrictMode>
);