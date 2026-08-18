import { useState } from 'react';
import { Home, Person, ZoomOut, AcUnit, Favorite, Settings, Search } from 'vite-mat-symbols';
import styles from './app.module.css';

const NAV = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'search', label: 'Search', Icon: Search },
  { id: 'person', label: 'Profile', Icon: Person },
  { id: 'settings', label: 'Settings', Icon: Settings },
] as const;

export function App() {
  const [active, setActive] = useState<string>('home');
  const [liked, setLiked] = useState(false);

  return (
    <div className={styles['page']}>
      <h1>vite-material-symbols</h1>

      {/* Weight switches at runtime — no rebuild, no second asset. */}
      <section>
        <h2>Active state via <code>wght</code></h2>
        <nav className={styles['nav']}>
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={styles['navItem']}
              aria-current={active === id ? 'page' : undefined}
              onClick={() => setActive(id)}
            >
              <Icon size={28} weight={active === id ? 700 : 300} fill={active === id ? 1 : 0} duration="200ms" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* Fractional FILL: only possible with a real variable font. */}
      <section>
        <h2>Fill animation</h2>
        <button className={styles['like']} onClick={() => setLiked((v) => !v)}>
          <Favorite size={48} fill={liked ? 1 : 0} weight={liked ? 600 : 400} duration="300ms"
                    label={liked ? 'Remove from favourites' : 'Add to favourites'} />
        </button>
      </section>

      <section>
        <h2>Static axis sweep</h2>
        <div className={styles['row']}>
          {[100, 200, 300, 400, 500, 600, 700].map((w) => (
            <ZoomOut key={w} size={36} weight={w} />
          ))}
        </div>
        <div className={styles['row']}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <AcUnit key={f} size={36} fill={f} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
