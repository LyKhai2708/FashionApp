import { Fragment } from 'react';
import { Navigate, Route } from 'react-router-dom';
import DefaultLayout from '../layouts/DefaultLayout';

type RouteType = {
  path: string;
  component: React.ComponentType;
  layout?: typeof DefaultLayout | typeof Fragment | null;
};

// Pages
import Home from '../pages/Home';
import ProductPage from '../pages/ProductPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import Cart from '../pages/Cart';
import NotFound from '../layouts/404Page';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Order from '../pages/Order';
import ProfilePage from '../pages/ProfilePage';

// Public route definitions
const publicRoutes: RouteType[] = [
  { path: '/', component: Home },
  { path: '/products', component: ProductPage },
  { path: '/collection/:categorySlug', component: ProductPage },
  { path: '/products/:id', component: ProductDetailPage },
  { path: '/cart', component: Cart },
  { path: '/login', component: Login, layout: Fragment},
  { path: '/register', component: Register , layout: Fragment},
  { path: '/order', component: Order},
  { path: '/profile', component: ProfilePage},
];

export const generateRoutes = () => {
  return [
    ...publicRoutes.map((route, index) => {
      const Page = route.component;
      let Layout = DefaultLayout;

      if (route.layout) {
        Layout = route.layout;
      } else if (route.layout === null) {
        Layout = Fragment;
      }

      return (
        <Route
          key={index}
          path={route.path}
          element={
            <Layout>
              <Page />
            </Layout>
          }
        />
      );
    }),
    <Route key="notfound-redirect" path="/404" element={<NotFound />} />,
    <Route key="catchall" path="*" element={<Navigate to="/404" replace />} />,
  ];
};

export const navigateItems = [
  { key: '/', label: 'Trang chủ' },
  { key: '/products', label: 'Sản phẩm' },
  { key: '/cart', label: 'Giỏ hàng' },
];


