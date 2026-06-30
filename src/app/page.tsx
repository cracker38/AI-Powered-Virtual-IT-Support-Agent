import styles from "./page.module.css";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.navLeftWrapper}>
          <Image 
            src="/cypadi trancyparent logo.png" 
            alt="CYPADI Logo" 
            width={50} 
            height={50} 
            className={styles.headerLogo} 
            priority
          />
          <nav className={styles.navLeft}>
            <Link href="/about" className={styles.navLink}>About</Link>
            <Link href="/privacy" className={styles.navLink}>Privacy /Terms</Link>
            <Link href="/faq" className={styles.navLink}>FAQ</Link>
          </nav>
        </div>
        
        <div className={styles.navRight}>
          <div className={styles.langToggle}>
            En <ChevronDown size={18} />
          </div>
          <Link href="/register">
            <button className={styles.createAccountBtn}>Create Account</button>
          </Link>
          <Link href="/login">
            <button className={styles.loginBtn}>Log in</button>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.logoArea}>
          <Image 
            src="/cypadi trancyparent logo.png" 
            alt="CYPADI Logo" 
            width={70} 
            height={70} 
            className={styles.logoImage} 
            priority
          />
          <h1 className={styles.logoText}>AVISA</h1>
        </div>

        <h2 className={styles.title}>
          Your intelligent virtual IT support companion
        </h2>

        <p className={styles.description}>
          We help you quickly resolve technical problems, troubleshoot
          software issues, reset passwords, and get instant IT assistance
          anytime, anywhere.
        </p>

        <div className={styles.ctaRow}>
          <Link href="/register">
            <button className={styles.secondaryCtaBtn}>
              Create Account
            </button>
          </Link>
          <Link href="/chat">
            <button className={styles.ctaBtn}>
              Start Chat with the Virtual IT Support Agent
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
