import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Problem4J',
  tagline: 'Introducing Problem model from RFC7807 (aka RFC9457) to Java.',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://problem4j.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'problem4j', // Usually your GitHub org/user name.
  projectName: 'problem4j.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/problem4j-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Problem4J',
      logo: {
        alt: 'Problem4J Logo',
        src: 'img/problem4j.png',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Docs',
        // },
        {to: '/docs/intro', label: 'Intro', position: 'left'},
        {to: '/docs/problem4j-core', label: 'Problem4J Core', position: 'left'},
        {to: '/docs/problem4j-jackson', label: 'Problem4J Jackson', position: 'left'},
        {to: '/docs/category/problem4j-spring', label: 'Problem4J Spring', position: 'left'},
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/problem4j',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Intro',
              to: '/docs/intro',
            },
            {
              label: 'Problem4J Core',
              to: '/docs/problem4j-core',
            },
            {
              label: 'Problem4J Jackson',
              to: '/docs/problem4j-jackson',
            },
            {
              label: 'Problem4J Spring',
              to: '/docs/category/problem4j-spring',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/problem4j',
            },
          ],
        },
        {
          title: 'References',
          items: [
            {
              label: 'RFC7807 - Problem Details for HTTP APIs',
              href: 'https://datatracker.ietf.org/doc/html/rfc7807'
            },
            {
              label: 'RFC9457 - Problem Details for HTTP APIs',
              href: 'https://datatracker.ietf.org/doc/html/rfc9457'
            },
            {
              label: 'Jackson',
              href: 'https://github.com/FasterXML/jackson'
            },
            {
              label: 'Spring Boot',
              href: 'https://docs.spring.io/spring-boot/index.html'
            },
            {
              label: 'Docusaurus',
              href: 'https://docusaurus.io/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Problem4J Team & Contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["java", "kotlin"]
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
