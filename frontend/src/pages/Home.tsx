import { navigate, type Route } from "../router";
import styles from "./pages.module.css";

export function Shell({
  active,
  children,
}: {
  active?: "home" | "playground" | "problems";
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a
          className={styles.logo}
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          C<span>-</span>FORGE
        </a>
        <nav className={styles.nav}>
          <a
            className={`${styles.navLink}${active === "playground" ? " " + styles.navActive : ""}`}
            href="/playground"
            onClick={(e) => {
              e.preventDefault();
              navigate("/playground");
            }}
          >
            Playground
          </a>
          <a
            className={`${styles.navLink}${active === "problems" ? " " + styles.navActive : ""}`}
            href="/problems"
            onClick={(e) => {
              e.preventDefault();
              navigate("/problems");
            }}
          >
            Problems
          </a>
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function Home(_props: { route: Route }) {
  return (
    <Shell>
      <div className={styles.homeBody}>
        <div className={styles.homeLogo}>
          C<span>-</span>FORGE
        </div>
        <div className={styles.homeSub}>C / MEMORY / DATA STRUCTURES</div>
        <div className={styles.cards}>
          <a
            className={styles.card}
            href="/playground"
            onClick={(e) => {
              e.preventDefault();
              navigate("/playground");
            }}
          >
            <div className={styles.cardTitle}>Playground</div>
            <div className={styles.cardDesc}>Write &amp; watch C execute.</div>
            <div className={styles.cardArrow}>→ open</div>
          </a>
          <a
            className={styles.card}
            href="/problems"
            onClick={(e) => {
              e.preventDefault();
              navigate("/problems");
            }}
          >
            <div className={styles.cardTitle}>Problems</div>
            <div className={styles.cardDesc}>Learn &amp; replay problems.</div>
            <div className={styles.cardArrow}>→ open</div>
          </a>
        </div>
      </div>
    </Shell>
  );
}
