// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { Menu, Home, Person } from 'vite-mat-symbols';

console.log(Menu, Home, Person);

export function App() {
  return (
    <div>
      <li>
        <Menu />
      </li>
      <li>
        <Home />
      </li>
      <li>
        <Person />
      </li>
    </div>
  );
}

export default App;
