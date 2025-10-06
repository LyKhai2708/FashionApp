import { Fragment } from 'react';
import { Navigate, Route } from 'react-router-dom';
import DefaultLayout from '../layouts/DefaultLayout';

type RouteType = {
  path: string;
  component: React.ComponentType;
  layout?: typeof DefaultLayout | typeof Fragment | null;
};

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProductPage from '../pages/ProductPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import Cart from '../pages/Cart';
import Order from '../pages/Order';
import ProfilePage from '../pages/ProfilePage';
import NotFound from '../layouts/404Page';


const publicRoutes: RouteType[] = [
  { path: '/', component: Home, layout: Fragment },
  { path: '/login', component: Login, layout: null },
  { path: '/register', component: Register, layout: null },
  { path: '/products', component: ProductPage },
  { path: '/collection/:categorySlug', component: ProductPage },
  { path: '/products/:slug', component: ProductDetailPage },
];

const privateRoutes: RouteType[] = [
  { path: '/cart', component: Cart },
  { path: '/order', component: Order },
  { path: '/profile', component: ProfilePage },
];


export const generatePublicRoutes = (isAuthenticated: boolean) => {
  return publicRoutes.map((route, index) => {
    const Page = route.component;
    let Layout = DefaultLayout;

    if (route.layout) {
      Layout = route.layout;
    } else if (route.layout === null) {
      Layout = Fragment;
    }

    // Redirect to home if user is authenticated and tries to access login/register
    if (isAuthenticated && (route.path === '/login' || route.path === '/register')) {
      return <Route key={index} path={route.path} element={<Navigate to="/" />} />;
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
  });
};


export const generatePrivateRoutes = (isAuthenticated: boolean) => {
  if (isAuthenticated) {
    return privateRoutes.map((route, index) => {
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
    });
  } else {

    return privateRoutes.map((route, index) => (
      <Route key={index} path={route.path} element={<Navigate to="/login" />} />
    ));
  }
};

export const generateRoutes = (isAuthenticated: boolean) => {
  return [
    ...generatePublicRoutes(isAuthenticated),
    ...generatePrivateRoutes(isAuthenticated),
    <Route key="notfound-redirect" path="/404" element={<NotFound />} />,
    <Route key="catchall" path="*" element={<Navigate to="/404" replace />} />,
  ];
};


