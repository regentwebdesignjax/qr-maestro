/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import CreateQR from './pages/CreateQR';
import Dashboard from './pages/Dashboard';
import EditQR from './pages/EditQR';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Redirect from './pages/Redirect';
import ViewQR from './pages/ViewQR';
import WhyUs from './pages/WhyUs';
import MyQRCodes from './pages/MyQRCodes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Analytics": Analytics,
    "CreateQR": CreateQR,
    "Dashboard": Dashboard,
    "EditQR": EditQR,
    "FAQ": FAQ,
    "Home": Home,
    "Pricing": Pricing,
    "Redirect": Redirect,
    "ViewQR": ViewQR,
    "WhyUs": WhyUs,
    "MyQRCodes": MyQRCodes,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};