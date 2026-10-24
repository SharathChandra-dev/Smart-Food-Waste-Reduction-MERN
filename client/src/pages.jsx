import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, imageUrl, messageOf } from './api.js';
import { useAuth } from './context.jsx';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  CircleHelp,
  ClipboardList,
  Clock3,
  Edit3,
  Filter,
  Mail,
  MapPin,
  MessageSquareText,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
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

export function HomePage() {
  const { user } = useAuth();
  const [state, setState] = useState({});
  async function contact(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ busy: true });
    try {
      const { data } = await api.post('/contacts', Object.fromEntries(new FormData(form)));
      setState({ success: data.message });
      form.reset();
    } catch (err) {
      setState({ error: messageOf(err) });
    }
  }
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> A community-powered food network
          </div>
          <h1>
            Good food.
            <br />
            <em>Good neighbors.</em>
            <br />
            Less going to waste.
          </h1>
          <p>
            Share extra food with people nearby, or find something delicious before it’s gone. Small
            acts make a big difference.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" to={user ? '/foods' : '/register'}>
              {user ? 'Explore available food' : 'Join the community'}
              <ArrowRight size={18} />
            </Link>
            <Link className="text-link" to="/foods">
              See what’s fresh <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <span>F</span>
              <span>M</span>
              <span>A</span>
              <span>+</span>
            </div>
            <span>Neighbors sharing, together</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-photo" role="img" aria-label="Fresh produce in a market" />
          <div className="floating-note note-top">
            <span className="note-icon green">
              <Check size={17} />
            </span>
            <span>
              <strong>Saved from waste</strong>
              <small>One meal at a time</small>
            </span>
          </div>
          <div className="floating-note note-bottom">
            <span className="note-icon peach">
              <MapPin size={17} />
            </span>
            <span>
              <strong>Right around you</strong>
              <small>Local pickup, made easy</small>
            </span>
          </div>
          <div className="hero-sun" />
        </div>
      </section>
      <section className="impact-strip">
        <div>
          <span className="impact-mark">
            <SproutIcon />
          </span>
          <strong>Share with purpose</strong>
          <span>Give good food another table.</span>
        </div>
        <div>
          <span className="impact-mark peach">
            <MapPin size={21} />
          </span>
          <strong>Keep it local</strong>
          <span>Connect with people nearby.</span>
        </div>
        <div>
          <span className="impact-mark lavender">
            <Clock3 size={21} />
          </span>
          <strong>Act while it’s fresh</strong>
          <span>Quick requests and clear pickup.</span>
        </div>
      </section>
      <section className="home-food-section content-wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FRESH FROM THE COMMUNITY</div>
            <h2>Food worth sharing</h2>
            <p>Take a look at what neighbors have listed recently.</p>
          </div>
          <Link to="/foods" className="text-link">
            Explore all food <ArrowRight size={16} />
          </Link>
        </div>
        <FoodPreview />
      </section>
      <section className="join-band">
        <div className="join-inner">
          <div>
            <div className="eyebrow light">A LITTLE GOES A LONG WAY</div>
            <h2>
              Have something extra?
              <br />
              <em>Someone could use it.</em>
            </h2>
            <p>
              One listing can make a neighbor’s day and keep perfectly good food out of the bin.
            </p>
          </div>
          <Link className="button cream large" to={user ? '/foods/new' : '/register'}>
            Share food <ArrowRight size={17} />
          </Link>
          <span className="join-leaf leaf-a">✳</span>
          <span className="join-leaf leaf-b">✳</span>
        </div>
      </section>
      <section className="contact-area" id="contact">
        <div className="contact-copy">
          <div className="eyebrow">WE’RE HERE TO HELP</div>
          <h2>Say hello.</h2>
          <p>
            Questions, ideas, or want to work together? Send a note and the team will get back to
            you.
          </p>
          <div className="contact-detail">
            <Mail size={18} />
            <a href="mailto:Sharath.workdev@gmail.com">Sharath.workdev@gmail.com</a>
          </div>
          <div className="contact-detail">
            <MapPin size={18} />
            SRH Campus Munich
          </div>
        </div>
        <form className="contact-card" onSubmit={contact}>
          <Notice type="success">{state.success}</Notice>
          <Notice>{state.error}</Notice>
          <div className="form-grid">
            <Field label="Your name">
              <input name="name" required placeholder="How should we address you?" />
            </Field>
            <Field label="Email address">
              <input name="email" type="email" required placeholder="you@example.com" />
            </Field>
          </div>
          <Field label="Subject">
            <input name="subject" placeholder="What’s on your mind?" />
          </Field>
          <Field label="Message">
            <textarea name="message" rows="4" required placeholder="Write your message…" />
          </Field>
          <Button loading={state.busy}>
            Send message <Send size={16} />
          </Button>
          <small className="form-footnote">Your email is only used to reply to your message.</small>
        </form>
      </section>
    </>
  );
}

function SproutIcon() {
  return <span aria-hidden="true">✳</span>;
}
function FoodPreview() {
  const [foods, setFoods] = useState([]);
  useEffect(() => {
    api
      .get('/foods')
      .then((r) => setFoods(r.data.foods.slice(0, 3)))
      .catch(() => {});
  }, []);
  if (!foods.length)
    return <div className="preview-empty">Food listings from your community will appear here.</div>;
  return (
    <div className="food-grid">
      {foods.map((f) => (
        <FoodCard key={f._id} food={f} />
      ))}
    </div>
  );
}
function FoodCard({ food }) {
  const expiring = new Date(food.expiry_date_sfwr) < new Date(Date.now() + 3 * 864e5);
  return (
    <Link to={`/foods/${food._id}`} className="food-card">
      <div className="food-card-image">
        {food.foodimage_sfwr ? (
          <img src={imageUrl(food.foodimage_sfwr)} alt={food.foodname_sfwr} />
        ) : (
          <div className="image-placeholder">🥬</div>
        )}
        <span className={`food-status ${expiring ? 'soon' : ''}`}>
          {expiring ? 'Use soon' : 'Fresh today'}
        </span>
      </div>
      <div className="food-card-body">
        <div className="food-category">{food.foodcategory_sfwr}</div>
        <h3>{food.foodname_sfwr}</h3>
        <div className="food-card-meta">
          <span>
            <MapPin size={14} />
            {food.pickup_location_sfwr}
          </span>
          <span>
            <Package size={14} />
            {food.foodquantity_sfwr} available
          </span>
        </div>
        <div className="food-card-bottom">
          <span>Best before {formatDate(food.expiry_date_sfwr)}</span>
          <span className="circle-arrow">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AuthPage() {
  const register = useLocation().pathname === '/register';
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const { data } = await api.post(
        register ? '/auth/register' : '/auth/login',
        register
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              passwordConfirmation: form.passwordConfirmation,
            }
          : { email: form.email, password: form.password },
      );
      if (data.requiresTwoFactor) {
        setChallenge(data.challengeToken);
        return;
      }
      setUser(data.user);
      navigate(data.user.role_sfwr === 'Admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/verify', {
        challengeToken: challenge,
        code: new FormData(e.currentTarget).get('code'),
      });
      setUser(data.user);
      navigate(data.user.role_sfwr === 'Admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="eyebrow light">THE GOOD FOOD CIRCLE</div>
        <h1>
          Pass it on.
          <br />
          <em>Make it matter.</em>
        </h1>
        <p>There’s more than one way to make a difference. Start with what’s in your kitchen.</p>
        <div className="auth-visual-image" />
        <div className="auth-quote">“A shared meal is a little act of hope.”</div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <Link to="/" className="back-home">
            ← Back to home
          </Link>
          <div className="auth-symbol">
            {challenge ? <ShieldCheck /> : register ? <Users /> : <span>✳</span>}
          </div>
          <div className="eyebrow">
            {challenge ? 'ONE MORE STEP' : register ? 'COME ON IN' : 'WELCOME BACK'}
          </div>
          <h2>{challenge ? 'Verify it’s you' : register ? 'Create your account' : 'Sign in'}</h2>
          <p>
            {challenge
              ? 'Enter the 6-digit code from your authenticator app.'
              : register
                ? 'Join neighbors making a difference with good food.'
                : 'Pick up where you left off.'}
          </p>
          <Notice>{error}</Notice>
          {challenge ? (
            <form onSubmit={verify} className="stack-form">
              <Field label="Authenticator code">
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  required
                  autoFocus
                />
              </Field>
              <Button loading={busy}>
                Verify and continue <ArrowRight size={17} />
              </Button>
            </form>
          ) : (
            <form onSubmit={submit} className="stack-form">
              {register && (
                <Field label="Your name">
                  <input name="name" autoComplete="name" required />
                </Field>
              )}
              <Field label="Email address">
                <input name="email" type="email" autoComplete="email" required />
              </Field>
              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                />
              </Field>
              {register && (
                <Field label="Confirm password">
                  <input
                    name="passwordConfirmation"
                    type="password"
                    minLength="8"
                    autoComplete="new-password"
                    required
                  />
                </Field>
              )}
              <Button loading={busy}>
                {register ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
              </Button>
            </form>
          )}
          <div className="auth-switch">
            {register ? 'Already have an account?' : 'New to FoodShare?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create account'}
            </Link>
          </div>
          <small className="auth-security">
            <ShieldCheck size={14} /> Your account is protected and your details stay private.
          </small>
        </div>
      </div>
    </div>
  );
}

export function FoodsPage() {
  const [params, setParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const category = params.get('category') || 'all';
  useEffect(() => {
    setLoading(true);
    api
      .get('/foods', { params: { search, category } })
      .then(({ data }) => {
        setFoods(data.foods);
        setCategories(data.categories);
        setError('');
      })
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  }, [search, category]);
  return (
    <div className="content-wrap">
      <div className="food-hero">
        <div>
          <div className="eyebrow light">GOOD FOOD IS OUT THERE</div>
          <h1>
            Find your next
            <br />
            <em>favorite thing.</em>
          </h1>
          <p>Browse food shared by your community, ready for a new home.</p>
        </div>
        <div className="food-hero-icon">✳</div>
      </div>
      <div className="browse-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search food"
            value={search}
            placeholder="Search food by name…"
            onChange={(e) =>
              setParams(
                (p) => {
                  e.target.value ? p.set('search', e.target.value) : p.delete('search');
                  return p;
                },
                { replace: true },
              )
            }
          />
        </div>
        <label className="select-filter">
          <Filter size={17} />
          <select
            value={category}
            onChange={(e) =>
              setParams((p) => {
                e.target.value === 'all' ? p.delete('category') : p.set('category', e.target.value);
                return p;
              })
            }
          >
            <option value="all">All categories</option>
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="results-line">
        <span>
          {loading
            ? 'Finding food…'
            : `${foods.length} ${foods.length === 1 ? 'listing' : 'listings'} to explore`}
        </span>
        <span>
          <ArrowDownWideNarrow size={15} /> Sorted by freshness
        </span>
      </div>
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : foods.length ? (
        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard key={food._id} food={food} />
          ))}
        </div>
      ) : (
        <Empty
          title="No food found"
          text="Try another name or category. New listings are added by your community."
        />
      )}
    </div>
  );
}

export function FoodDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api
      .get(`/foods/${id}`)
      .then((r) => setFood(r.data.food))
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  }, [id]);
  async function claim() {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/foods/${id}/claim`);
      setSuccess(data.message);
      setError('');
    } catch (e) {
      setError(messageOf(e));
    }
  }
  if (loading) return <Loading />;
  if (!food)
    return (
      <div className="content-wrap">
        <Notice>{error}</Notice>
        <Link to="/foods" className="button secondary">
          Back to food
        </Link>
      </div>
    );
  return (
    <div className="content-wrap detail-wrap">
      <Link className="back-home" to="/foods">
        ← Back to available food
      </Link>
      <div className="detail-card">
        <div className="detail-image">
          {food.foodimage_sfwr ? (
            <img src={imageUrl(food.foodimage_sfwr)} alt={food.foodname_sfwr} />
          ) : (
            <div className="image-placeholder">🥗</div>
          )}
        </div>
        <div className="detail-body">
          <div className="food-category">{food.foodcategory_sfwr}</div>
          <h1>{food.foodname_sfwr}</h1>
          <p className="detail-description">
            {food.fooddescription_sfwr ||
              'Shared with care. Contact the provider for more details.'}
          </p>
          <Notice type="success">{success}</Notice>
          <Notice>{error}</Notice>
          <div className="detail-facts">
            <div>
              <Package />
              <span>
                Quantity<strong>{food.foodquantity_sfwr} available</strong>
              </span>
            </div>
            <div>
              <CalendarDays />
              <span>
                Best before<strong>{formatDate(food.expiry_date_sfwr)}</strong>
              </span>
            </div>
            <div>
              <MapPin />
              <span>
                Pickup location<strong>{food.pickup_location_sfwr}</strong>
              </span>
            </div>
            <div>
              <Clock3 />
              <span>
                Collect before<strong>{formatDate(food.available_till_sfwr)}</strong>
              </span>
            </div>
            <div>
              <Users />
              <span>
                Shared by<strong>{food.id_user_sfwr?.username_sfwr || 'Community catalog'}</strong>
              </span>
            </div>
            <div>
              <MessageSquareText />
              <span>
                Contact<strong>{food.contact_sfwr}</strong>
              </span>
            </div>
          </div>
          <Button onClick={claim} disabled={Boolean(user && food.id_user_sfwr?._id === user.id)}>
            {user ? 'Request this food' : 'Sign in to request'}
          </Button>
          {!user && (
            <small className="form-footnote">You’ll need an account to request a listing.</small>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get('/my/claims')
      .then((r) => setClaims(r.data.claims))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="YOUR FOOD REQUESTS"
        title="My requests"
        description="Follow along as your requests are reviewed."
      />
      {loading ? (
        <Loading />
      ) : claims.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Requested</th>
                <th>Pickup</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.id_food_sfwr?.foodname_sfwr || 'Listing removed'}</strong>
                  </td>
                  <td>{formatDate(c.claimed_at)}</td>
                  <td>{c.id_food_sfwr?.pickup_location_sfwr || '—'}</td>
                  <td>
                    <span className={`status-pill ${c.status_sfwr}`}>{c.status_sfwr}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No requests yet"
          text="When you find something tasty, send a request and it’ll show up here."
        />
      )}
    </div>
  );
}

export function MyFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();
  const reload = () =>
    api
      .get('/my/foods')
      .then((r) => setFoods(r.data.foods))
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  useEffect(() => {
    reload();
  }, []);
  async function del() {
    try {
      await api.delete(`/foods/${confirm._id}`);
      setFoods(foods.filter((f) => f._id !== confirm._id));
      setConfirm(null);
    } catch (e) {
      setError(messageOf(e));
      setConfirm(null);
    }
  }
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="YOUR COMMUNITY POSTS"
        title="My food listings"
        description="Keep your food details up to date for people nearby."
        action={
          <Link className="button primary" to="/foods/new">
            <Plus size={17} /> Add food
          </Link>
        }
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : foods.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Category</th>
                <th>Best before</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f._id}>
                  <td>
                    <span className="table-food">
                      <img
                        src={
                          imageUrl(f.foodimage_sfwr) ||
                          '/images/foods/demo-catalog/01-apples-1-kg.jpg'
                        }
                        alt=""
                      />
                      <strong>{f.foodname_sfwr}</strong>
                    </span>
                  </td>
                  <td>{f.foodcategory_sfwr}</td>
                  <td>{formatDate(f.expiry_date_sfwr)}</td>
                  <td>{f.foodquantity_sfwr}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() => navigate(`/foods/new?edit=${f._id}`)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-button danger-text"
                        title="Delete"
                        onClick={() => setConfirm(f)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No listings yet" text="Share food you can’t use and give it a new home." />
      )}
      {confirm && (
        <Confirm
          message={`Delete “${confirm.foodname_sfwr}”? This cannot be undone.`}
          onCancel={() => setConfirm(null)}
          onConfirm={del}
        />
      )}
    </div>
  );
}

// Admin overview and CRUD panels.
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((r) => setData(r.data))
      .catch((e) => setError(messageOf(e)));
  }, []);
  if (!data && !error) return <Loading />;
  const s = data?.stats || {};
  return (
    <div>
      <PageTitle
        eyebrow="COMMUNITY OVERVIEW"
        title="Good morning, admin."
        description="Here’s a snapshot of what’s happening across FoodShare."
      />
      <Notice>{error}</Notice>
      <div className="stats-grid admin-stats">
        {[
          ['Community members', s.totalUsers, Users],
          ['Food listings', s.totalFoods, Package],
          ['Awaiting review', s.pendingClaims, ClipboardList],
          ['Expiring this week', s.totalExpiringSoon, Clock3],
        ].map(([label, val, Icon]) => (
          <div className="stat-card static" key={label}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{val ?? 0}</strong>
          </div>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">REQUESTS</div>
              <h2>Request status</h2>
            </div>
            <Link className="text-link" to="/admin/claims">
              Review requests <ArrowRight size={15} />
            </Link>
          </div>
          <div className="request-statuses">
            <div>
              <span className="status-dot pending-dot" />
              <span>Pending</span>
              <strong>{s.pendingClaims || 0}</strong>
            </div>
            <div>
              <span className="status-dot approved-dot" />
              <span>Approved</span>
              <strong>{s.approvedClaims || 0}</strong>
            </div>
            <div>
              <span className="status-dot rejected-dot" />
              <span>Declined</span>
              <strong>{s.rejectedClaims || 0}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">LISTINGS</div>
              <h2>By category</h2>
            </div>
          </div>
          {data?.categories?.length ? (
            data.categories.map((c) => (
              <div className="category-row" key={c.name}>
                <span>{c.name || 'Other'}</span>
                <div className="category-track">
                  <i style={{ width: `${Math.max(4, (c.count / (s.totalFoods || 1)) * 100)}%` }} />
                </div>
                <strong>{c.count}</strong>
              </div>
            ))
          ) : (
            <p className="muted">Food categories appear when a listing is added.</p>
          )}
        </section>
        <section className="panel admin-shortcuts">
          <div className="panel-head">
            <div>
              <div className="eyebrow">QUICK ACTIONS</div>
              <h2>Manage the site</h2>
            </div>
          </div>
          <Link to="/admin/foods">
            <Package />
            Food inventory <ArrowRight />
          </Link>
          <Link to="/admin/contacts">
            <Mail />
            Contact messages <ArrowRight />
          </Link>
          <Link to="/admin/users">
            <Users />
            People <ArrowRight />
          </Link>
        </section>
      </div>
    </div>
  );
}

export function AdminFoods() {
  return <FoodManager />;
}
function FoodManager() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const reload = () =>
    api
      .get('/admin/foods')
      .then((r) => setFoods(r.data.foods))
      .catch((e) => setError(messageOf(e)))
      .finally(() => setLoading(false));
  useEffect(() => {
    reload();
  }, []);
  async function remove() {
    try {
      await api.delete(`/foods/${confirm._id}`);
      setFoods(foods.filter((f) => f._id !== confirm._id));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setConfirm(null);
    }
  }
  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      if (editing?._id)
        await api.put(`/foods/${editing._id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      else await api.post('/foods', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditing(null);
      setLoading(true);
      reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <div>
      <PageTitle
        eyebrow="INVENTORY MANAGEMENT"
        title="Food listings"
        description={`${foods.length} listings across the community.`}
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={17} /> Add food
          </Button>
        }
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : foods.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Food item</th>
                <th>Category</th>
                <th>Expires</th>
                <th>Quantity</th>
                <th>Provider</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f._id}>
                  <td>
                    <span className="table-food">
                      <img
                        src={
                          imageUrl(f.foodimage_sfwr) ||
                          '/images/foods/demo-catalog/01-apples-1-kg.jpg'
                        }
                        alt=""
                      />
                      <strong>{f.foodname_sfwr}</strong>
                    </span>
                  </td>
                  <td>{f.foodcategory_sfwr}</td>
                  <td>{formatDate(f.expiry_date_sfwr)}</td>
                  <td>{f.foodquantity_sfwr}</td>
                  <td>{f.id_user_sfwr?.username_sfwr || 'Catalog'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEditing(f)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-text" onClick={() => setConfirm(f)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No food listings" />
      )}
      {editing && <FoodEditModal food={editing} onClose={() => setEditing(null)} onSave={save} />}
      {confirm && (
        <Confirm
          message={`Delete “${confirm.foodname_sfwr}”?`}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
function FoodEditModal({ food, onClose, onSave }) {
  return (
    <Modal title={food._id ? 'Edit food' : 'Add a food listing'} onClose={onClose}>
      <form className="form-grid" onSubmit={onSave} encType="multipart/form-data">
        <Field label="Food name">
          <input name="foodname_sfwr" defaultValue={food.foodname_sfwr} required />
        </Field>
        <Field label="Category">
          <input name="foodcategory_sfwr" defaultValue={food.foodcategory_sfwr} required />
        </Field>
        <Field label="Manufactured / prepared">
          <input
            name="manufacturing_date_sfwr"
            type="date"
            defaultValue={food.manufacturing_date_sfwr?.slice(0, 10)}
            required
          />
        </Field>
        <Field label="Expires">
          <input
            name="expiry_date_sfwr"
            type="date"
            defaultValue={food.expiry_date_sfwr?.slice(0, 10)}
            required
          />
        </Field>
        <Field label="Quantity">
          <input
            name="foodquantity_sfwr"
            type="number"
            min="1"
            defaultValue={food.foodquantity_sfwr}
            required
          />
        </Field>
        <Field label="Calories">
          <input
            name="calories_sfwr"
            type="number"
            min="0"
            defaultValue={food.calories_sfwr ?? 0}
            required
          />
        </Field>
        <Field label="Contact">
          <input name="contact_sfwr" defaultValue={food.contact_sfwr} required />
        </Field>
        <Field label="Pickup location">
          <input name="pickup_location_sfwr" defaultValue={food.pickup_location_sfwr} required />
        </Field>
        <Field label="Available until">
          <input
            name="available_till_sfwr"
            type="datetime-local"
            defaultValue={food.available_till_sfwr?.slice(0, 16)}
            required
          />
        </Field>
        <Field label="Photo">
          <input name="image" type="file" accept="image/*" />
        </Field>
        <Field label="Description">
          <textarea name="fooddescription_sfwr" rows="3" defaultValue={food.fooddescription_sfwr} />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button>Save listing</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function reload() {
    try {
      const { data } = await api.get('/admin/claims');
      setClaims(data.claims);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function setStatus(id, status) {
    try {
      await api.patch(`/admin/claims/${id}`, { status_sfwr: status });
      await reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <div>
      <PageTitle
        eyebrow="COMMUNITY REQUESTS"
        title="Food requests"
        description="Review requests from neighbors and approve one pickup per listing."
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : claims.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Requested by</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.id_food_sfwr?.foodname_sfwr || 'Removed food'}</strong>
                    <small className="table-sub">{c.id_food_sfwr?.pickup_location_sfwr}</small>
                  </td>
                  <td>
                    {c.id_user_sfwr?.username_sfwr}
                    <small className="table-sub">{c.id_user_sfwr?.email_sfwr}</small>
                  </td>
                  <td>{formatDate(c.claimed_at)}</td>
                  <td>
                    <span className={`status-pill ${c.status_sfwr}`}>{c.status_sfwr}</span>
                  </td>
                  <td>
                    {c.status_sfwr === 'pending' ? (
                      <div className="table-actions">
                        <Button
                          variant="small-success"
                          onClick={() => setStatus(c._id, 'approved')}
                        >
                          <Check size={15} /> Approve
                        </Button>
                        <Button variant="small-danger" onClick={() => setStatus(c._id, 'rejected')}>
                          <X size={15} /> Decline
                        </Button>
                      </div>
                    ) : (
                      'Reviewed'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No requests yet" text="New food requests will show up here." />
      )}
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  async function reload() {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function save(e) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (edit?.id) await api.put(`/admin/users/${edit.id}`, v);
      else await api.post('/admin/users', v);
      setEdit(null);
      setLoading(true);
      reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function remove() {
    try {
      await api.delete(`/admin/users/${confirm.id}`);
      setUsers(users.filter((u) => u.id !== confirm.id));
    } catch (e) {
      setError(messageOf(e));
    }
    setConfirm(null);
  }
  const visible = users.filter((u) =>
    `${u.username_sfwr} ${u.email_sfwr}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageTitle
        eyebrow="COMMUNITY MEMBERS"
        title="People"
        description={`${users.length} accounts in your community.`}
        action={
          <Button onClick={() => setEdit({})}>
            <Plus size={16} /> Add person
          </Button>
        }
      />
      <Notice>{error}</Notice>
      <div className="toolbar">
        <div className="search-field compact">
          <Search size={16} />
          <input
            placeholder="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.username_sfwr}</strong>
                  </td>
                  <td>{u.email_sfwr}</td>
                  <td>
                    <span className={`role-pill ${u.role_sfwr === 'Admin' ? 'admin' : ''}`}>
                      {u.role_sfwr}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEdit(u)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-text" onClick={() => setConfirm(u)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No matching accounts" />
      )}
      {edit && (
        <Modal title={edit.id ? 'Edit account' : 'Add a person'} onClose={() => setEdit(null)}>
          <form className="stack-form" onSubmit={save}>
            <Field label="Full name">
              <input name="name" defaultValue={edit.username_sfwr} required />
            </Field>
            <Field label="Email">
              <input name="email" type="email" defaultValue={edit.email_sfwr} required />
            </Field>
            <Field label={edit.id ? 'New password (optional)' : 'Temporary password'}>
              <input name="password" type="password" minLength="8" required={!edit.id} />
            </Field>
            <Field label="Role">
              <select name="role" defaultValue={edit.role_sfwr || 'User'}>
                <option>User</option>
                <option>Admin</option>
              </select>
            </Field>
            <div className="modal-actions">
              <Button variant="secondary" type="button" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button>Save account</Button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Confirm
          message={`Delete ${confirm.username_sfwr}'s account and related records?`}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState(null);
  async function reload() {
    try {
      const { data } = await api.get('/admin/contacts');
      setContacts(data.contacts);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function send(e) {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get('admin_response_sfwr');
    try {
      await api.post(`/admin/contacts/${reply._id}/reply`, { admin_response_sfwr: text });
      setReply(null);
      setLoading(true);
      reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <div>
      <PageTitle
        eyebrow="COMMUNITY INBOX"
        title="Messages"
        description="Read contact requests and send replies by email."
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : contacts.length ? (
        <div className="message-list">
          {contacts.map((c) => (
            <article className="message-card" key={c._id}>
              <div className="message-head">
                <div>
                  <div className="message-subject">{c.subject_sfwr || 'Contact form message'}</div>
                  <div className="message-meta">
                    {c.name_sfwr} · <a href={`mailto:${c.email_sfwr}`}>{c.email_sfwr}</a> ·{' '}
                    {formatDate(c.createdAt)}
                  </div>
                </div>
                {c.replied_at_sfwr ? (
                  <span className="status-pill approved">
                    <CheckCheck size={14} /> Replied
                  </span>
                ) : (
                  <span className="status-pill pending">Needs reply</span>
                )}
              </div>
              <p className="message-body">{c.message_sfwr}</p>
              {c.admin_response_sfwr && (
                <div className="sent-reply">
                  <strong>Your reply</strong>
                  <p>{c.admin_response_sfwr}</p>
                </div>
              )}
              <div className="message-actions">
                <Button variant="secondary" onClick={() => setReply(c)}>
                  <Send size={15} />
                  {c.replied_at_sfwr ? 'Send another reply' : 'Reply by email'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Inbox is clear" text="Messages from the contact form will arrive here." />
      )}
      {reply && (
        <Modal title={`Reply to ${reply.name_sfwr}`} onClose={() => setReply(null)}>
          <form className="stack-form" onSubmit={send}>
            <div className="reply-to">
              <Mail size={16} /> Sending to <strong>{reply.email_sfwr}</strong>
            </div>
            <Field label="Your reply">
              <textarea
                name="admin_response_sfwr"
                rows="7"
                defaultValue={reply.admin_response_sfwr || ''}
                required
                autoFocus
              />
            </Field>
            <p className="form-footnote">
              This sends a real email using SMTP settings from server/.env.
            </p>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setReply(null)}>
                Cancel
              </Button>
              <Button>
                <Send size={16} /> Send email
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AdminHeaders() {
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  async function reload() {
    try {
      const { data } = await api.get('/admin/headers');
      setHeaders(data.headers);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (editing?._id) await api.put(`/admin/headers/${editing._id}`, body);
      else await api.post('/admin/headers', body);
      setEditing(null);
      setError('');
      setSuccess('Heading saved and applied to the selected area.');
      window.dispatchEvent(new Event('sfwr:settings-updated'));
      setLoading(true);
      await reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function remove() {
    try {
      await api.delete(`/admin/headers/${confirm._id}`);
      setHeaders(headers.filter((h) => h._id !== confirm._id));
      setError('');
      setSuccess('Heading deleted. The default or next saved heading is now in use.');
      window.dispatchEvent(new Event('sfwr:settings-updated'));
    } catch (e) {
      setError(messageOf(e));
    }
    setConfirm(null);
  }
  return (
    <div>
      <PageTitle
        eyebrow="SITE CONFIGURATION"
        title="Site headings"
        description="User website changes the brand at the top of the public site. Admin panel changes the title above the admin menu. Updates apply immediately."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={16} /> Add heading
          </Button>
        }
      />
      <Notice>{error}</Notice>
      <Notice type="success">{success}</Notice>
      {loading ? (
        <Loading />
      ) : headers.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Heading</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h._id}>
                  <td>
                    <span className="role-pill">{h.page_type_sfwr}</span>
                  </td>
                  <td>
                    <strong>{h.heading_sfwr}</strong>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEditing(h)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-text" onClick={() => setConfirm(h)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No custom headings"
          text="You can add a heading for either side of the app."
        />
      )}
      {editing && (
        <Modal
          title={editing._id ? 'Edit heading' : 'Add heading'}
          onClose={() => setEditing(null)}
        >
          <form className="stack-form" onSubmit={save}>
            {!editing._id && (
              <Field label="Page">
                <select name="page_type_sfwr">
                  <option value="user">User website</option>
                  <option value="admin">Admin panel</option>
                </select>
              </Field>
            )}
            <Field label="Heading">
              <input
                name="heading_sfwr"
                defaultValue={editing.heading_sfwr}
                required
                maxLength="255"
              />
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button>Save heading</Button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Confirm
          message={`Delete the heading “${confirm.heading_sfwr}”?`}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export function TrackerPage({ kind }) {
  const meta = {
    calorie: ['Calorie tracker', 'Keep a simple record of meals and calories.', 'calories'],
    expense: ['Food expenses', 'Track grocery spending and see where it goes.', 'expenses'],
    reminder: ['Food reminders', 'A timely reminder can help good food get used.', 'reminders'],
  }[kind];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  async function reload() {
    try {
      const { data } = await api.get(`/trackers/${kind}`);
      setRecords(data.records);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setLoading(true);
    reload();
  }, [kind]);
  async function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (edit?._id) await api.put(`/trackers/${kind}/${edit._id}`, body);
      else await api.post(`/trackers/${kind}`, body);
      setEdit(null);
      setLoading(true);
      reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function remove() {
    try {
      await api.delete(`/trackers/${kind}/${confirm._id}`);
      setRecords(records.filter((r) => r._id !== confirm._id));
    } catch (e) {
      setError(messageOf(e));
    }
    setConfirm(null);
  }
  const total = records.reduce((s, r) => s + Number(r.amount_sfwr || 0), 0);
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow={meta[2].toUpperCase()}
        title={meta[0]}
        description={meta[1]}
        action={
          <Button onClick={() => setEdit({})}>
            <Plus size={16} /> Add record
          </Button>
        }
      />
      <Notice>{error}</Notice>
      {records.length > 0 && (
        <div className="tracker-summary">
          <span>
            {kind === 'expense'
              ? 'Tracked spending'
              : kind === 'calorie'
                ? 'Calories recorded'
                : 'Active reminders'}
          </span>
          <strong>
            {kind === 'reminder'
              ? records.filter((r) => r.status_sfwr !== 'completed').length
              : kind === 'expense'
                ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(
                    total,
                  )
                : `${total.toLocaleString()} kcal`}
          </strong>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : records.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{kind === 'reminder' ? 'Reminder' : 'Food / item'}</th>
                <th>
                  {kind === 'expense' ? 'Category' : kind === 'calorie' ? 'Calories' : 'Status'}
                </th>
                <th>Date</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>{r.title_sfwr}</strong>
                  </td>
                  <td>
                    {kind === 'expense'
                      ? `${r.category_sfwr || 'Other'} · €${Number(r.amount_sfwr || 0).toFixed(2)}`
                      : kind === 'calorie'
                        ? `${r.amount_sfwr || 0} kcal`
                        : r.status_sfwr}
                  </td>
                  <td>{formatDate(r.date_sfwr)}</td>
                  <td>{r.notes_sfwr || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEdit(r)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-text" onClick={() => setConfirm(r)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title={`No ${kind === 'reminder' ? 'reminders' : 'records'} yet`}
          text="Add a record to start keeping track."
        />
      )}
      {edit && (
        <Modal title={edit._id ? 'Edit record' : 'Add record'} onClose={() => setEdit(null)}>
          <form className="stack-form" onSubmit={save}>
            <Field label={kind === 'reminder' ? 'Reminder' : 'Food / item'}>
              <input name="title_sfwr" defaultValue={edit.title_sfwr} required />
            </Field>
            {kind !== 'reminder' && (
              <Field label={kind === 'expense' ? 'Amount (€)' : 'Calories'}>
                <input
                  name="amount_sfwr"
                  type="number"
                  step={kind === 'expense' ? '.01' : '1'}
                  min="0"
                  defaultValue={edit.amount_sfwr || ''}
                />
              </Field>
            )}
            {kind === 'expense' && (
              <Field label="Category">
                <input name="category_sfwr" defaultValue={edit.category_sfwr} />
              </Field>
            )}
            <Field label={kind === 'reminder' ? 'Reminder date' : 'Date'}>
              <input
                name="date_sfwr"
                type="date"
                defaultValue={edit.date_sfwr?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
              />
            </Field>
            {kind === 'reminder' && (
              <Field label="Status">
                <select name="status_sfwr" defaultValue={edit.status_sfwr || 'pending'}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            )}
            <Field label="Notes">
              <textarea name="notes_sfwr" rows="3" defaultValue={edit.notes_sfwr} />
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button>Save record</Button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Confirm
          message={`Delete “${confirm.title_sfwr}”?`}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

export function IntakePage() {
  const [items, setItems] = useState([]);
  const [foods, setFoods] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  async function reload() {
    try {
      const [i, f] = await Promise.all([api.get('/intakes'), api.get('/my/foods')]);
      setItems(i.data.intakes);
      setFoods(f.data.foods);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (edit?._id) await api.put(`/intakes/${edit._id}`, body);
      else await api.post('/intakes', body);
      setEdit(null);
      setLoading(true);
      reload();
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function remove(id) {
    try {
      await api.delete(`/intakes/${id}`);
      setItems(items.filter((i) => i._id !== id));
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="FOOD JOURNAL"
        title="Food intake"
        description="Record what you’ve used or eaten and keep your kitchen notes together."
        action={
          <Button onClick={() => setEdit({})}>
            <Plus size={16} /> Add intake
          </Button>
        }
      />
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : items.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Date</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i._id}>
                  <td>
                    <strong>{i.foodintake_sfwr}</strong>
                  </td>
                  <td>{formatDate(i.intake_date_sfwr)}</td>
                  <td>{i.notes_sfwr || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => setEdit(i)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button danger-text" onClick={() => remove(i._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Your food journal is empty" />
      )}
      {edit && (
        <Modal
          title={edit._id ? 'Edit intake' : 'Record food intake'}
          onClose={() => setEdit(null)}
        >
          <form className="stack-form" onSubmit={save}>
            <Field label="Food name">
              <input
                name="foodintake_sfwr"
                defaultValue={edit.foodintake_sfwr}
                required
                list="my-food-options"
              />
              <datalist id="my-food-options">
                {foods.map((f) => (
                  <option value={f.foodname_sfwr} key={f._id} />
                ))}
              </datalist>
            </Field>
            <Field label="Date">
              <input
                name="intake_date_sfwr"
                type="date"
                defaultValue={
                  edit.intake_date_sfwr?.slice(0, 10) || new Date().toISOString().slice(0, 10)
                }
              />
            </Field>
            <Field label="Notes">
              <textarea name="notes_sfwr" defaultValue={edit.notes_sfwr} />
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button>Save intake</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [twofa, setTwofa] = useState(null);
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const { data } = await api.put('/profile', new FormData(e.currentTarget), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      setSuccess(data.message);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  async function setup() {
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setTwofa(data);
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function enable(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/2fa/enable', {
        code: new FormData(e.currentTarget).get('code'),
      });
      setUser(data.user);
      setTwofa(null);
      setSuccess(data.message);
    } catch (e) {
      setError(messageOf(e));
    }
  }
  async function disable(e) {
    e.preventDefault();
    try {
      const { data } = await api.delete('/auth/2fa', {
        data: { password: new FormData(e.currentTarget).get('password') },
      });
      setUser(data.user);
      setSuccess(data.message);
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <div className="content-wrap narrow">
      <PageTitle
        eyebrow="YOUR ACCOUNT"
        title="Profile and security"
        description="Update your details and keep your account protected."
      />
      <Notice>{error}</Notice>
      <Notice type="success">{success}</Notice>
      <form className="form-card stack-form" onSubmit={save} encType="multipart/form-data">
        <div className="profile-avatar">
          <img
            src={
              imageUrl(user.profile_image_sfwr) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username_sfwr)}&background=e7f0e6&color=245441`
            }
            alt="Profile"
          />
        </div>
        <Field label="Name">
          <input name="username_sfwr" defaultValue={user.username_sfwr} required />
        </Field>
        <Field label="Email address">
          <input name="email_sfwr" type="email" defaultValue={user.email_sfwr} required />
        </Field>
        <Field label="Profile photo">
          <input name="image" type="file" accept="image/*" />
        </Field>
        <div className="profile-divider" />
        <Field label="Current password" hint="Required only when changing your password">
          <input name="current_password" type="password" autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <input name="password" type="password" minLength="8" autoComplete="new-password" />
        </Field>
        <Button loading={busy}>Save profile</Button>
      </form>
      <section className="panel security-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">ACCOUNT SECURITY</div>
            <h2>Two-factor authentication</h2>
          </div>
          <span className={`status-pill ${user.two_factor_enabled_sfwr ? 'approved' : 'pending'}`}>
            {user.two_factor_enabled_sfwr ? 'Enabled' : 'Not enabled'}
          </span>
        </div>
        <p>Use an authenticator app to add a verification step when signing in.</p>
        {user.two_factor_enabled_sfwr ? (
          <form className="inline-form" onSubmit={disable}>
            <Field label="Confirm your password">
              <input type="password" name="password" required />
            </Field>
            <Button variant="secondary">Disable 2FA</Button>
          </form>
        ) : (
          <Button variant="secondary" onClick={setup}>
            <ShieldCheck size={17} /> Set up 2FA
          </Button>
        )}
      </section>
      {twofa && (
        <Modal title="Set up two-factor authentication" onClose={() => setTwofa(null)}>
          <div className="twofa-setup">
            <img src={twofa.qrDataUrl} alt="Authenticator QR code" />
            <p>
              Scan this code in your authenticator app, then enter the 6-digit code to enable
              sign-in verification.
            </p>
            <code>{twofa.secret}</code>
          </div>
          <form className="stack-form" onSubmit={enable}>
            <Field label="6-digit code">
              <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required />
            </Field>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setTwofa(null)}>
                Cancel
              </Button>
              <Button>Enable 2FA</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
