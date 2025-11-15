'use client';

import type { i18n, Resource } from 'i18next';
import { createInstance } from 'i18next';
import { useEffect, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

let _globalI18n: i18n;

export const isServer = typeof window === 'undefined';

const i18nConfigDefault = {
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
};

const initTranslation = (
  options: {
    lang: string;
    resources: Resource;
    defaultNS?: string;
  }
) => {
  const globalI18n = _globalI18n;
  const { lang, resources, defaultNS } = options;
  const i18nOptions = {
    ...i18nConfigDefault,
    lng: lang,
    defaultNS: defaultNS || 'common',
    resources: JSON.parse(JSON.stringify(resources)),
    initImmediate: false,
  };
  if (globalI18n) {
    return globalI18n.cloneInstance(i18nOptions);
  }
  const i18nInstance = createInstance();
  i18nInstance.use(initReactI18next).init(i18nOptions);

  _globalI18n = i18nInstance;
  return i18nInstance;
};

export const I18nProvider = (props: {
  children: React.ReactNode;
  lang?: string;
  resources: Resource;
  defaultNS?: string;
}) => {
  const { children, lang = 'en', ...rest } = props;
  const [i18n] = useState(initTranslation({
    lang,
    ...rest,
  }));

  useEffect(() => {
    if (!i18n || !lang) return;
    i18n.changeLanguage(lang);
  }, [i18n, lang]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
