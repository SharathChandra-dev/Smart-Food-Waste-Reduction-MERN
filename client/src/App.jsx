import React, { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { api, imageUrl, messageOf } from './api.js';
import { useAuth } from './context.jsx';
import {
  AlertTriangle,
  ArrowRight,
  Apple,
  ChartNoAxesCombined,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Clock3,
  CookingPot,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Users,
  X,
} from 'lucide-react';
import {
  Button,
  Confirm,
  Empty,
  Field,
  Loading,
  Modal,
  Notice,
  PageTitle,
  formatDate,
} from './components/UI.jsx';
import {
  AdminDashboard,
  AdminUsers,
  AdminFoods,
  AdminClaims,
  AdminContacts,
  AdminHeaders,
  AuthPage,
  FoodsPage,
  FoodDetail,
  HomePage,
  MyClaims,
  MyFoods,
  ProfilePage,
  TrackerPage,
  IntakePage,
} from './pages.jsx';

function Protected({ admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role_sfwr !== 'Admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function Shell() {
  const { user, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const [heading, setHeading] = useState('FoodShare');
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const loadHeading = () =>
      api
        .get('/settings')
        .then(({ data }) => setHeading(data.userHeading))
        .catch(() => {});
    loadHeading();
    window.addEventListener('sfwr:settings-updated', loadHeading);
    return () => window.removeEventListener('sfwr:settings-updated', loadHeading);
  }, []);
  const headingWords = heading.trim().split(/\s+/);
  const headingFirst = headingWords.shift() || 'FoodShare';
  const headingRest = headingWords.join(' ');
  const admin = user?.role_sfwr === 'Admin';
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Sprout size={23} />
          </span>
          <span>
            {headingFirst}
            {headingRest && (
              <>
                {' '}
                <span className="brand-light">{headingRest}</span>
              </>
            )}
            <small>SMART FOOD WASTE REDUCER</small>
          </span>
        </Link>
        <nav className={`topnav${menu ? ' open' : ''}`}>
          <NavLink to="/foods">Find food</NavLink>
          {user && <NavLink to="/my/claims">My requests</NavLink>}
          {user && !admin && <NavLink to="/my/foods">My listings</NavLink>}
          {user && !admin && <NavLink to="/dashboard">My kitchen</NavLink>}
          {admin && <NavLink to="/admin">Admin</NavLink>}
          {!user ? (
            <div className="nav-account">
              <Link className="nav-signin" to="/login">
                Sign in
              </Link>
              <Link className="button primary nav-join" to="/register">
                Create account <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="nav-account">
              <Link className="user-chip" to="/profile">
                <span className="avatar">{user.username_sfwr?.slice(0, 1).toUpperCase()}</span>
                <span>{user.username_sfwr}</span>
              </Link>
              <button
                className="icon-button"
                aria-label="Sign out"
                title="Sign out"
                onClick={signOut}
              >
                <LogOut size={17} />
              </button>
            </div>
          )}
        </nav>
        <button
          className="mobile-menu-button"
          onClick={() => setMenu(!menu)}
          aria-label="Toggle menu"
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand inverse" to="/">
              <span className="brand-mark">
                <Sprout size={22} />
              </span>
              <span>
                Food<span className="brand-light">Share</span>
                <small>SMART FOOD WASTE REDUCER</small>
              </span>
            </Link>
            <p>
              Good food deserves a good home. Share surplus, find local food, and make less go to
              waste.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/foods">Available food</Link>
            <Link to="/foods/new">Share food</Link>
            <Link to="/dashboard">My kitchen</Link>
          </div>
          <div>
            <h3>Get in touch</h3>
            <a href="mailto:Sharath.workdev@gmail.com">Send us an email</a>
            <a href="https://maps.google.com/?q=SRH+Campus+Munich" target="_blank" rel="noreferrer">
              Sendlinger Str. 7, 81547 Munich, Germany
            </a>
            <a href="tel:+4915510323692">+49 155 10323692</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Smart Food Waste Reducer</span>
          <span>
            Made for a more thoughtful food system <Heart size={14} />
          </span>
        </div>
      </footer>
    </div>
  );
}

function MyKitchen() {
  const { user } = useAuth();
  const [data, setData] = useState({ foods: [], claims: [], intakes: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.get('/my/foods'), api.get('/my/claims'), api.get('/intakes')])
      .then(([a, b, c]) =>
        setData({ foods: a.data.foods, claims: b.data.claims, intakes: c.data.intakes }),
      )
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  const soon = data.foods.filter(
    (f) =>
      new Date(f.expiry_date_sfwr) <= new Date(Date.now() + 7 * 864e5) &&
      new Date(f.expiry_date_sfwr) >= new Date(),
  ).length;
  const cards = [
    { label: 'Your food listings', value: data.foods.length, icon: Package, to: '/my/foods' },
    {
      label: 'Open requests',
      value: data.claims.filter((c) => c.status_sfwr === 'pending').length,
      icon: ClipboardList,
      to: '/my/claims',
    },
    { label: 'Expiring this week', value: soon, icon: AlertTriangle, to: '/my/foods' },
    { label: 'Food recorded', value: data.intakes.length, icon: CookingPot, to: '/calories' },
  ];
  return (
    <div className="content-wrap">
      <section className="welcome-banner">
        <div>
          <div className="eyebrow light">YOUR COMMUNITY KITCHEN</div>
          <h1>Welcome back, {user.username_sfwr.split(' ')[0]}.</h1>
          <p>A little care goes a long way. Here’s what’s happening with your food.</p>
        </div>
        <div className="welcome-art">
          <Sprout size={112} />
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
        </div>
      </section>
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link className="stat-card" to={to} key={label}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <ArrowRight className="stat-arrow" size={17} />
          </Link>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">GET STARTED</div>
            <h2>Your next good thing</h2>
          </div>
        </div>
        <div className="action-grid">
          <Link className="action-card" to="/foods/new">
            <span className="action-icon green">
              <Plus />
            </span>
            <strong>Share surplus food</strong>
            <p>List extra ingredients or a prepared meal nearby.</p>
            <span className="action-link">
              Create a listing <ArrowRight size={15} />
            </span>
          </Link>
          <Link className="action-card" to="/foods">
            <span className="action-icon peach">
              <Search />
            </span>
            <strong>Find food to enjoy</strong>
            <p>Browse food shared by your community.</p>
            <span className="action-link">
              Browse food <ArrowRight size={15} />
            </span>
          </Link>
          <Link className="action-card" to="/calories">
            <span className="action-icon lilac">
              <CookingPot />
            </span>
            <strong>Track what you eat</strong>
            <p>Keep a simple record of your food intake.</p>
            <span className="action-link">
              Open tracker <ArrowRight size={15} />
            </span>
          </Link>
          <Link className="action-card" to="/expenses">
            <span className="action-icon peach">
              <Package />
            </span>
            <strong>Track expenses</strong>
            <p>Keep an eye on grocery spending.</p>
            <span className="action-link">
              Open expenses <ArrowRight size={15} />
            </span>
          </Link>
          <Link className="action-card" to="/reminders">
            <span className="action-icon lilac">
              <Clock3 />
            </span>
            <strong>Set a reminder</strong>
            <p>Remember to use what’s in your kitchen.</p>
            <span className="action-link">
              Open reminders <ArrowRight size={15} />
            </span>
          </Link>
          <Link className="action-card" to="/intakes">
            <span className="action-icon green">
              <ClipboardList />
            </span>
            <strong>Food journal</strong>
            <p>Keep notes on food you’ve used.</p>
            <span className="action-link">
              Open journal <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function AdminLayout() {
  const [heading, setHeading] = useState('SFWR Admin');
  useEffect(() => {
    const loadHeading = () =>
      api
        .get('/settings')
        .then(({ data }) => setHeading(data.adminHeading))
        .catch(() => {});
    loadHeading();
    window.addEventListener('sfwr:settings-updated', loadHeading);
    return () => window.removeEventListener('sfwr:settings-updated', loadHeading);
  }, []);
  const links = [
    ['/admin', 'Overview', LayoutDashboard],
    ['/admin/foods', 'Food listings', Package],
    ['/admin/claims', 'Food requests', ClipboardList],
    ['/admin/users', 'People', Users],
    ['/admin/contacts', 'Messages', MessageCircle],
    ['/admin/headers', 'Site headings', Settings],
  ];
  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-space-title">{heading}</div>
        <div className="admin-side-label">WORKSPACE</div>
        {links.map(([to, label, Icon]) => (
          <NavLink end={to === '/admin'} to={to} key={to}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <div className="sidebar-note">
          <ShieldCheck size={19} />
          <strong>Admin tools</strong>
          <span>Changes here update the community site.</span>
        </div>
      </aside>
      <div className="admin-page">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="foods" element={<FoodsPage />} />
        <Route path="foods/:id" element={<FoodDetail />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route element={<Protected />}>
          <Route path="dashboard" element={<MyKitchen />} />
          <Route path="my/foods" element={<MyFoods />} />
          <Route path="foods/new" element={<FoodFormPage />} />
          <Route path="my/claims" element={<MyClaims />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="calories" element={<TrackerPage kind="calorie" />} />
          <Route path="expenses" element={<TrackerPage kind="expense" />} />
          <Route path="reminders" element={<TrackerPage kind="reminder" />} />
          <Route path="intakes" element={<IntakePage />} />
        </Route>
        <Route element={<Protected admin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="foods" element={<AdminFoods />} />
            <Route path="claims" element={<AdminClaims />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="headers" element={<AdminHeaders />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function FoodFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const [food, setFood] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (editId)
      api
        .get(`/foods/${editId}`)
        .then((r) => setFood(r.data.food))
        .catch((e) => setError(messageOf(e)));
  }, [editId]);
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = new FormData(event.currentTarget);
      if (editId)
        await api.put(`/foods/${editId}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      else await api.post('/foods', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/my/foods');
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  if (editId && !food && !error) return <Loading />;
  return (
    <div className="content-wrap narrow">
      <PageTitle
        eyebrow="SHARE WITH YOUR COMMUNITY"
        title={editId ? 'Edit your food listing' : 'List surplus food'}
        description="Add clear details so neighbors can request and collect it safely."
      />
      <Notice>{error}</Notice>
      <form className="form-card form-grid" onSubmit={submit} encType="multipart/form-data">
        <Field label="Food name">
          <input
            name="foodname_sfwr"
            required
            maxLength="255"
            defaultValue={food?.foodname_sfwr}
            placeholder="e.g. Fresh apples"
          />
        </Field>
        <Field label="Category">
          <input
            name="foodcategory_sfwr"
            required
            defaultValue={food?.foodcategory_sfwr}
            placeholder="Fruit, bakery…"
          />
        </Field>
        <Field label="Manufacturing / prepared date">
          <input
            name="manufacturing_date_sfwr"
            type="date"
            required
            defaultValue={
              food?.manufacturing_date_sfwr?.slice(0, 10) || new Date().toISOString().slice(0, 10)
            }
          />
        </Field>
        <Field label="Expiry date">
          <input
            name="expiry_date_sfwr"
            type="date"
            required
            defaultValue={food?.expiry_date_sfwr?.slice(0, 10)}
          />
        </Field>
        <Field label="Quantity">
          <input
            name="foodquantity_sfwr"
            type="number"
            min="1"
            required
            defaultValue={food?.foodquantity_sfwr}
          />
        </Field>
        <Field label="Calories per serving">
          <input
            name="calories_sfwr"
            type="number"
            min="0"
            required
            defaultValue={food?.calories_sfwr ?? 0}
          />
        </Field>
        <Field label="Contact number">
          <input
            name="contact_sfwr"
            required
            defaultValue={food?.contact_sfwr}
            placeholder="+49 …"
          />
        </Field>
        <Field label="Pickup location">
          <input
            name="pickup_location_sfwr"
            required
            defaultValue={food?.pickup_location_sfwr}
            placeholder="Neighborhood or address"
          />
        </Field>
        <Field label="Available until">
          <input
            name="available_till_sfwr"
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            required
            defaultValue={food?.available_till_sfwr?.slice(0, 16)}
          />
        </Field>
        <Field label="Photo">
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
        </Field>
        <Field label="Description">
          <textarea
            name="fooddescription_sfwr"
            rows="4"
            defaultValue={food?.fooddescription_sfwr}
            placeholder="Ingredients, storage, pickup notes…"
          />
        </Field>
        <div className="form-actions">
          <Button loading={busy}>{editId ? 'Save changes' : 'Publish food'}</Button>
          <Link className="button secondary" to="/my/foods">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
function NotFound() {
  return (
    <div className="content-wrap">
      <div className="empty">
        <strong>Page not found</strong>
        <p>The page you’re looking for doesn’t exist.</p>
        <Link className="button primary" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
