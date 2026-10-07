import type { Metadata } from 'next';
import Image from 'next/image';
import NotFoundTitle from '@/components/NotFoundTitle';
import s from './notFound.module.css';

// One static 404.html serves every missing address, so all three languages
// are in the page and the root layout's early script (which sets <html lang>
// from the path before the first paint) decides which one shows. Without
// JavaScript the English one stays, as the html element says.
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const copy = [
  {
    lang: 'en',
    title: 'This page does not exist',
    text: 'The address may be mistyped, or the page has moved. Everything about Shuuty starts from the home page.',
    home: 'Home page',
    homeHref: '/',
    guides: 'Guides',
    guidesHref: '/guides/',
    documentTitle: 'Page not found | Shuuty',
  },
  {
    lang: 'pl',
    title: 'Tej strony nie ma',
    text: 'Adres może mieć literówkę albo strona zmieniła miejsce. Wszystko o Shuuty znajdziesz od strony głównej.',
    home: 'Strona główna',
    homeHref: '/pl/',
    guides: 'Poradniki',
    guidesHref: '/pl/poradniki/',
    documentTitle: 'Nie ma takiej strony | Shuuty',
  },
  {
    lang: 'nb',
    title: 'Denne siden finnes ikke',
    text: 'Adressen kan være feilskrevet, eller siden er flyttet. Alt om Shuuty finner du fra forsiden.',
    home: 'Forsiden',
    homeHref: '/nb/',
    guides: 'Guider',
    guidesHref: '/nb/guider/',
    documentTitle: 'Siden finnes ikke | Shuuty',
  },
] as const;

const documentTitles = Object.fromEntries(copy.map((item) => [item.lang, item.documentTitle]));

export default function NotFound() {
  return (
    <main className={s.page}>
      <div className={s.card}>
        <span className={s.mark} aria-hidden="true">
          <Image src="/images/brand/shuuty-app-icon.png" alt="" width={56} height={56} />
        </span>
        <p className={s.code} aria-hidden="true">404</p>
        {copy.map((item) => (
          <div key={item.lang} className={s.lang} data-not-found-lang={item.lang} lang={item.lang}>
            <h1 className={s.title}>{item.title}</h1>
            <p className={s.text}>{item.text}</p>
            <div className={s.actions}>
              <a className={s.primary} href={item.homeHref}>
                {item.home}
              </a>
              <a className={s.secondary} href={item.guidesHref}>
                {item.guides}
              </a>
            </div>
          </div>
        ))}
      </div>
      <NotFoundTitle titles={documentTitles} />
    </main>
  );
}
