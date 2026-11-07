import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function ResponsePreview() {
  return (
    <div className={styles.window} aria-label="Example Problem Details response">
      <div className={styles.windowBar}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.windowTitle}>GET /orders/42</span>
      </div>
      <pre className={styles.windowBody}>
        <span className={styles.status}>HTTP/1.1 400 Bad Request</span>
        {'\n'}
        <span className={styles.header}>Content-Type:</span> application/problem+json
        {'\n\n'}
        {'{\n'}
        {'  '}<span className={styles.key}>"type"</span>: <span className={styles.str}>"https://example.org/errors/invalid-request"</span>,{'\n'}
        {'  '}<span className={styles.key}>"title"</span>: <span className={styles.str}>"Invalid Request"</span>,{'\n'}
        {'  '}<span className={styles.key}>"status"</span>: <span className={styles.num}>400</span>,{'\n'}
        {'  '}<span className={styles.key}>"detail"</span>: <span className={styles.str}>"bad input for user 123: email"</span>,{'\n'}
        {'  '}<span className={styles.key}>"instance"</span>: <span className={styles.str}>"/orders/42"</span>,{'\n'}
        {'  '}<span className={styles.key}>"traceId"</span>: <span className={styles.str}>"c0ffee42"</span>{'\n'}
        {'}'}
      </pre>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>RFC 7807 · RFC 9457 · Problem Details</span>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>
            Consistent API errors for Java that clients can parse and people can understand. An
            immutable <code>Problem</code> model, JSON mapping and Spring Boot integration that just
            work.
          </p>
          <div className={styles.buttons}>
            <Link className={clsx('button button--lg', styles.primaryButton)} to="/docs/intro">
              Get Started
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              href="https://github.com/problem4j">
              GitHub
            </Link>
          </div>
        </div>
        <div className={styles.heroPreview}>
          <ResponsePreview />
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Docs`}
      description={`Documentation pages of Problem4J. ${siteConfig.tagline}`}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
