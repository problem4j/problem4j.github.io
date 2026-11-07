import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'One Error Contract',
    Svg: require('@site/static/img/feature-standard.svg').default,
    description: (
      <>
        Every service answers failures the same way - <code>type</code>, <code>title</code>,{' '}
        <code>status</code>, <code>detail</code>, <code>instance</code> and custom extensions, as
        defined by RFC 7807 and RFC 9457.
      </>
    ),
  },
  {
    title: 'Immutable & Framework-Free',
    Svg: require('@site/static/img/feature-immutable.svg').default,
    description: (
      <>
        <code>Problem</code> is an immutable value object with a fluent builder. Use it in any Java
        application, on the server or in API clients, with ready-made Jackson and Gson
        mapping.
      </>
    ),
  },
  {
    title: 'Drop-in for Spring Boot',
    Svg: require('@site/static/img/feature-integration.svg').default,
    description: (
      <>
        Auto-configured for WebMVC and WebFlux. Map your exceptions with a{' '}
        <code>ProblemResolver</code> or <code>@ProblemMapping</code>, and get actionable details
        for validation and framework errors out of the box.
      </>
    ),
  },
];

type ModuleItem = {
  name: string;
  to: string;
  description: string;
};

const ModuleList: ModuleItem[] = [
  {
    name: 'problem4j-core',
    to: '/docs/problem4j-core',
    description: 'The immutable Problem model, builder and exception for any Java application.',
  },
  {
    name: 'problem4j-jackson',
    to: '/docs/problem4j-jackson/jackson',
    description: 'Serialize and deserialize Problem objects with Jackson.',
  },
  {
    name: 'problem4j-spring',
    to: '/docs/category/problem4j-spring',
    description: 'Problem Details responses for Spring Boot WebMVC and WebFlux applications.',
  },
  {
    name: 'problem4j-gson',
    to: '/docs/problem4j-gson',
    description: 'Serialize and deserialize Problem objects with Gson, on Java 8 and newer.',
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" aria-hidden="true" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Module({name, to, description}: ModuleItem) {
  return (
    <div className="col col--3">
      <Link className={styles.moduleCard} to={to}>
        <code className={styles.moduleName}>{name}</code>
        <p className={styles.moduleDescription}>{description}</p>
        <span className={styles.moduleMore}>Read the docs →</span>
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
      <section className={styles.modules}>
        <div className="container">
          <Heading as="h2" className={styles.modulesTitle}>
            Pick what you need
          </Heading>
          <div className="row">
            {ModuleList.map((props) => (
              <Module key={props.name} {...props} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
