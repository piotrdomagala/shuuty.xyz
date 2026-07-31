'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DocumentLanguage } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import s from './page.module.css';

type Lang = DocumentLanguage;
type Theme = 'light' | 'dark';
type IconName =
  | 'arrow'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'community'
  | 'download'
  | 'group'
  | 'map'
  | 'mic'
  | 'moon'
  | 'offer'
  | 'people'
  | 'private'
  | 'reminder'
  | 'send'
  | 'sun'
  | 'task'
  | 'work';

const t = {
  en: {
    a11y: {
      skip: 'Skip to content',
      language: 'Choose language',
      themeToLight: 'Switch to light mode',
      themeToDark: 'Switch to dark mode',
      mainNav: 'Main navigation',
      footerNav: 'Footer navigation',
    },
    nav: {
      overview: 'What is Shuuty',
      tasks: 'Tasks',
      groups: 'Groups',
      discover: 'Meetings / Map',
      download: 'Get the app',
    },
    hero: {
      badge: 'Available on iOS and Android',
      title: 'From idea',
      accent: 'to action.',
      sub: 'Create and delegate tasks by voice. Shape groups around any purpose, organise meetings and discover what you need nearby.',
      secondaryCta: 'See how it works',
      signals: ['Voice to task', 'Immediate delegation', 'Groups for any purpose'],
      visualLabel: 'One connected place',
      voice: 'Voice',
    },
    overview: {
      label: 'One connected ecosystem',
      heading: 'Everyday life does not happen in separate apps.',
      lead: 'Tasks, conversations, calendars, people and places belong to one flow. Shuuty keeps their context together from the first thought to the moment it gets done.',
      items: [
        {
          icon: 'task' as IconName,
          kicker: '01',
          title: 'Tasks that keep moving',
          desc: 'Create by voice, receive, delegate, discuss, remind and complete.',
          href: '#tasks',
        },
        {
          icon: 'group' as IconName,
          kicker: '02',
          title: 'Groups shaped around purpose',
          desc: 'A private circle, community, team, booking space, listing or local offer.',
          href: '#groups',
        },
        {
          icon: 'map' as IconName,
          kicker: '03',
          title: 'Meetings with a purpose',
          desc: 'Meet friends or new people, while the map helps you discover relevant groups, offers and activities.',
          href: '#discover',
        },
      ],
    },
    tasks: {
      label: '01 · Tasks',
      heading: 'Say it. Delegate it now. Remind at the right time.',
      lead: 'Say: “Alex should send the proposal tomorrow at 9. Remind Alex 30 minutes earlier.” Shuuty prepares the task with Alex as assignee, 09:00 as the due time and 08:30 as the reminder. Once created, Alex receives the task immediately. If approval is required, the request arrives immediately instead.',
      bullets: [
        'Private, received and delegated tasks stay in clear, separate views.',
        'A delegated task is delivered as soon as it is created. The due time defines when to do it. The reminder defines when the recipient is notified.',
        'A shared or delegated task can become a focused thinking space. Discussion, replies and all activity stay with the task.',
        'Subtasks, priority and time tracking help move from decisions to action.',
      ],
      voiceLabel: 'Voice task',
      voicePrompt: 'Alex should send the proposal tomorrow at 9. Remind Alex 30 minutes earlier.',
      parsedLabel: 'Ready to delegate',
      parsedTitle: 'Send the proposal',
      parsedMeta: ['Due · Tomorrow 09:00', 'Alex · receives it now', 'Reminder · 08:30'],
      delegate: 'Delegate to Alex now',
      deliveryNote: 'Alex receives the task now. Reminder: 08:30 · Due: 09:00.',
      flow: ['Speak', 'Review', 'Delegate now', 'Remind at 08:30'],
    },
    groups: {
      label: '02 · Groups',
      heading: 'One group. Any purpose.',
      lead: 'A group can be a private circle, open community, team, client space or booking system. It can also be a listing, an offer, a catalogue or simply an information space. You decide who can see it and which modules it needs.',
      bullets: [
        'Present services, products or announcements: local produce, vehicles, machinery or specialist services.',
        'Add a location so people can discover a public group and what it offers on the map.',
        'Keep it information-only, or enable chat, threads, tasks, calendars, bookings and time logs as its purpose grows.',
      ],
      modesLabel: 'One group, shaped around your needs',
      modes: [
        { icon: 'private' as IconName, title: 'Private circle', desc: 'Plans for a couple, family or close friends.' },
        { icon: 'community' as IconName, title: 'Open community', desc: 'People, interests and recurring activities.' },
        { icon: 'work' as IconName, title: 'Team & clients', desc: 'Tasks, decisions and per-person time logs.' },
        { icon: 'calendar' as IconName, title: 'Reservations', desc: 'Availability, fixed times or flexible booking ranges.' },
        { icon: 'offer' as IconName, title: 'Offers & information', desc: 'Listings, services, products or a public showcase.' },
      ],
    },
    discover: {
      label: '03 · Meetings',
      heading: 'Meet with a clear purpose.',
      lead: 'Create a private meet-up with friends or an open meeting for new people. Set the place and time, invite participants and keep the details in one shared context.',
      bullets: [
        'Meet privately with friends or open the plan to people you have not met yet.',
        'Keep the place, time, participants and conversation together.',
        'Use chat to agree the details before and after the meeting.',
      ],
      map: {
        label: 'Map · Discovery',
        heading: 'Find what you need nearby.',
        lead: 'Use the map to find relevant meetings, public groups and communities, plus groups presenting local offers, services, products or useful information.',
        bullets: [
          'Search by location, needs and interests.',
          'Open a meeting, group or offer and contact the people behind it.',
        ],
      },
      meetings: 'Meetings',
      groups: 'Groups & offers',
      mapCaption: 'Meetings, groups, offers and information around you',
    },
    flow: {
      label: 'From idea to action',
      heading: 'One natural flow instead of separate tools.',
      lead: 'Shuuty reduces the number of steps and keeps the context intact, so plans move forward without one person remembering everything for everyone.',
      items: [
        { icon: 'mic' as IconName, title: 'Capture the thought', desc: 'Speak it or create it manually while it is still fresh.' },
        { icon: 'people' as IconName, title: 'Choose the next step', desc: 'Create a private, delegated or group task, or set up a separate meeting.' },
        { icon: 'reminder' as IconName, title: 'Shuuty keeps track of deadlines and context', desc: 'The task, reminder, conversation, calendar and place can stay in one context.' },
      ],
    },
    faq: {
      label: 'FAQ',
      heading: 'The useful details',
      items: [
        {
          q: 'What can Shuuty understand from a voice task?',
          a: 'It can structure the title and description, detect a date and time, set a reminder, recognise an assignee and location, and split several thoughts into separate tasks for review.',
        },
        {
          q: 'Can I delegate a task while creating it?',
          a: 'Yes. If you assign someone while creating the task, they receive it immediately after creation. If their settings require approval, they receive the approval request immediately instead. The due time defines when to act. The reminder defines when to notify them. It never delays delivery.',
        },
        {
          q: 'What makes a group task different?',
          a: 'It keeps the group context and can also appear in Received for quick access. Members coordinate it alongside the conversation and, when enabled, the group calendar.',
        },
        {
          q: 'Is a group only for collaboration?',
          a: 'No. It can be a private circle, community, team, client space, booking system, listing, offer or catalogue of services and products. It can also be information-only and discoverable on the map.',
        },
        {
          q: 'How does the map help?',
          a: 'It helps you find nearby meetings, public groups, communities, information and groups presenting services, products or local offers. Search by location, needs and interests, then open the full context of the result.',
        },
        {
          q: 'Is Shuuty free?',
          a: 'You can start on the Free plan. Optional Pro and Teams plans raise limits and unlock advanced features.',
        },
      ],
    },
    cta: {
      eyebrow: 'Your next thought can move now',
      heading: 'Turn it into action.',
      sub: 'Download Shuuty and organise tasks, people, conversations, calendars and places in one app.',
    },
    images: {
      create: 'Shuuty create menu with task, voice, meeting and group actions',
      settings: 'Shuuty settings with light mode and language controls',
      groups: 'Shuuty map showing nearby groups',
      meetings: 'Shuuty map showing a meeting',
    },
    store: { apple: 'App Store', google: 'Google Play', applePrefix: 'Download on the', googlePrefix: 'Get it on' },
    footer: {
      tagline: 'From idea to action.',
      copyright: '© 2026 Shuuty. All rights reserved.',
      support: 'Support',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },
  pl: {
    a11y: {
      skip: 'Przejdź do treści',
      language: 'Wybierz język',
      themeToLight: 'Włącz jasny motyw',
      themeToDark: 'Włącz ciemny motyw',
      mainNav: 'Nawigacja główna',
      footerNav: 'Nawigacja w stopce',
    },
    nav: {
      overview: 'Czym jest Shuuty',
      tasks: 'Zadania',
      groups: 'Grupy',
      discover: 'Spotkania / Mapa',
      download: 'Pobierz aplikację',
    },
    hero: {
      badge: 'Dostępne na iOS i Android',
      title: 'Od pomysłu',
      accent: 'do działania.',
      sub: 'Twórz i deleguj zadania głosem. Dopasuj grupy do dowolnego celu, organizuj spotkania i odkrywaj w pobliżu to, czego potrzebujesz.',
      secondaryCta: 'Zobacz, jak to działa',
      signals: ['Głos zamienia się w zadanie', 'Natychmiastowe delegowanie', 'Grupy do dowolnego celu'],
      visualLabel: 'Jedno połączone miejsce',
      voice: 'Głos',
    },
    overview: {
      label: 'Jeden połączony ekosystem',
      heading: 'Codzienne życie nie dzieje się w osobnych aplikacjach.',
      lead: 'Zadania, rozmowy, kalendarze, ludzie i miejsca są częścią jednego przepływu. Shuuty zachowuje ich kontekst od pierwszej myśli aż do wykonania.',
      items: [
        {
          icon: 'task' as IconName,
          kicker: '01',
          title: 'Zadania, które żyją',
          desc: 'Twórz głosem, odbieraj, deleguj, rozmawiaj, przypominaj i kończ.',
          href: '#tasks',
        },
        {
          icon: 'group' as IconName,
          kicker: '02',
          title: 'Grupy dopasowane do celu',
          desc: 'Prywatny krąg, społeczność, zespół, rezerwacje, ogłoszenie albo lokalna oferta.',
          href: '#groups',
        },
        {
          icon: 'map' as IconName,
          kicker: '03',
          title: 'Spotkania z konkretnym celem',
          desc: 'Spotykaj się ze znajomymi lub nowymi osobami, a na mapie odkrywaj grupy, oferty i aktywności.',
          href: '#discover',
        },
      ],
    },
    tasks: {
      label: '01 · Zadania',
      heading: 'Powiedz. Deleguj od razu. Przypomnij na czas.',
      lead: 'Powiedz: „Ola ma jutro o 9 wysłać ofertę. Przypomnij jej 30 minut wcześniej”. Shuuty przygotuje zadanie dla Oli, ustawi termin na 09:00 i przypomnienie na 08:30. Po utworzeniu Ola otrzyma zadanie od razu. Jeśli wymaga akceptacji, od razu otrzyma prośbę o jego przyjęcie.',
      bullets: [
        'Zadania prywatne, otrzymane i delegowane mają czytelne, osobne widoki.',
        'Delegowane zadanie trafia do odbiorcy od razu po utworzeniu. Termin określa czas wykonania. Przypomnienie określa czas powiadomienia.',
        'Wspólne lub delegowane zadanie może stać się przestrzenią do wspólnego myślenia. Dyskusja, odpowiedzi i cała aktywność zostają przy zadaniu.',
        'Podzadania, priorytet i pomiar czasu pomagają przejść od ustaleń do działania.',
      ],
      voiceLabel: 'Zadanie głosowe',
      voicePrompt: 'Ola ma jutro o 9 wysłać ofertę. Przypomnij jej 30 minut wcześniej.',
      parsedLabel: 'Gotowe do delegowania',
      parsedTitle: 'Wyślij ofertę',
      parsedMeta: ['Termin · Jutro 09:00', 'Ola · otrzymuje teraz', 'Przypomnienie · 08:30'],
      delegate: 'Deleguj Oli teraz',
      deliveryNote: 'Ola otrzymuje zadanie teraz. Przypomnienie: 08:30 · Termin: 09:00.',
      flow: ['Powiedz', 'Sprawdź', 'Deleguj od razu', 'Przypomnij o 08:30'],
    },
    groups: {
      label: '02 · Grupy',
      heading: 'Jedna grupa. Dowolny cel.',
      lead: 'Grupa może być prywatnym kręgiem, otwartą społecznością, zespołem, przestrzenią dla klientów lub systemem rezerwacji. Może też działać jako ogłoszenie, oferta, katalog albo przestrzeń informacyjna. To Ty wybierasz jej widoczność i potrzebne moduły.',
      bullets: [
        'Prezentuj usługi, produkty i ogłoszenia: lokalne warzywa, samochody, maszyny lub usługi specjalistyczne.',
        'Dodaj lokalizację, aby użytkownicy mogli znaleźć publiczną grupę i jej ofertę na mapie.',
        'Zostaw ją wyłącznie informacyjną albo włącz czat, wątki, zadania, kalendarz, rezerwacje i ewidencję czasu, gdy tego potrzebujesz.',
      ],
      modesLabel: 'Jedna grupa, dokładnie taka, jakiej potrzebujesz',
      modes: [
        { icon: 'private' as IconName, title: 'Prywatny krąg', desc: 'Plany dla pary, rodziny albo bliskich znajomych.' },
        { icon: 'community' as IconName, title: 'Otwarta społeczność', desc: 'Ludzie, zainteresowania i powtarzalne aktywności.' },
        { icon: 'work' as IconName, title: 'Zespół i klienci', desc: 'Zadania, decyzje i ewidencja czasu dla każdej osoby.' },
        { icon: 'calendar' as IconName, title: 'Rezerwacje', desc: 'Dostępność, stałe terminy lub elastyczne przedziały.' },
        { icon: 'offer' as IconName, title: 'Oferty i informacje', desc: 'Ogłoszenia, usługi, produkty albo publiczna wizytówka.' },
      ],
    },
    discover: {
      label: '03 · Spotkania',
      heading: 'Spotkajcie się wokół konkretnego celu.',
      lead: 'Twórz prywatne spotkania ze znajomymi albo otwarte spotkania dla nowych osób. Ustal miejsce i czas, zaproś uczestników i zachowaj wszystkie szczegóły w jednym kontekście.',
      bullets: [
        'Spotykaj się prywatnie ze znajomymi albo otwórz plan na osoby, których jeszcze nie znasz.',
        'Trzymaj miejsce, czas, uczestników i rozmowę razem.',
        'Ustalaj szczegóły na czacie przed spotkaniem i po nim.',
      ],
      map: {
        label: 'Mapa · Odkrywanie',
        heading: 'Znajdź w pobliżu to, czego potrzebujesz.',
        lead: 'Na mapie znajdziesz odpowiednie spotkania, publiczne grupy i społeczności, a także grupy prezentujące lokalne oferty, usługi, produkty lub przydatne informacje.',
        bullets: [
          'Szukaj według miejsca, potrzeb i zainteresowań.',
          'Otwórz spotkanie, grupę lub ofertę i skontaktuj się z jej twórcami.',
        ],
      },
      meetings: 'Spotkania',
      groups: 'Grupy i oferty',
      mapCaption: 'Spotkania, grupy, oferty i informacje wokół Ciebie',
    },
    flow: {
      label: 'Od pomysłu do działania',
      heading: 'Jeden naturalny proces zamiast wielu osobnych narzędzi.',
      lead: 'Shuuty łączy kolejne kroki i zachowuje kontekst, żeby żaden plan nie zależał wyłącznie od czyjejś pamięci.',
      items: [
        { icon: 'mic' as IconName, title: 'Złap myśl', desc: 'Powiedz ją albo zapisz ręcznie, zanim zniknie z głowy.' },
        { icon: 'people' as IconName, title: 'Wybierz następny krok', desc: 'Utwórz zadanie prywatne, delegowane lub grupowe albo zaplanuj osobne spotkanie.' },
        { icon: 'reminder' as IconName, title: 'Shuuty pilnuje terminów i kontekstu', desc: 'Zadanie, przypomnienie, rozmowa, kalendarz i miejsce mogą pozostać w jednym kontekście.' },
      ],
    },
    faq: {
      label: 'FAQ',
      heading: 'Konkrety, które warto znać',
      items: [
        {
          q: 'Co Shuuty rozumie z zadania głosowego?',
          a: 'Potrafi uporządkować tytuł i opis, rozpoznać datę i godzinę, ustawić przypomnienie, rozpoznać odbiorcę i miejsce oraz rozdzielić kilka myśli na osobne zadania do sprawdzenia.',
        },
        {
          q: 'Czy mogę delegować zadanie już podczas tworzenia?',
          a: 'Tak. Jeśli przypiszesz osobę podczas tworzenia, otrzyma zadanie od razu po jego utworzeniu. Jeśli jej ustawienia wymagają akceptacji, od razu otrzyma prośbę o przyjęcie zadania. Termin określa czas wykonania. Przypomnienie określa czas powiadomienia. Nigdy nie opóźnia dostarczenia zadania.',
        },
        {
          q: 'Czym różni się zadanie grupowe?',
          a: 'Zachowuje kontekst grupy i może pojawić się także w Otrzymanych jako szybki dostęp. Członkowie koordynują je obok rozmowy i kalendarza grupy, jeśli jest włączony.',
        },
        {
          q: 'Czy grupa służy tylko do współpracy?',
          a: 'Nie. Może być prywatnym kręgiem, społecznością, zespołem, przestrzenią dla klientów, systemem rezerwacji, ogłoszeniem, ofertą albo katalogiem usług i produktów. Może też być wyłącznie informacyjna i widoczna na mapie.',
        },
        {
          q: 'W czym pomaga mapa?',
          a: 'Pomaga znaleźć w pobliżu spotkania, publiczne grupy, społeczności, informacje oraz grupy prezentujące usługi, produkty lub lokalne oferty. Szukasz według miejsca, potrzeb i zainteresowań, a potem otwierasz pełny kontekst wyniku.',
        },
        {
          q: 'Czy Shuuty jest darmowe?',
          a: 'Możesz zacząć od planu Free. Opcjonalne plany Pro i Teams zwiększają limity i odblokowują dodatkowe funkcje.',
        },
      ],
    },
    cta: {
      eyebrow: 'Następna myśl może ruszyć od razu',
      heading: 'Zamień ją w działanie.',
      sub: 'Pobierz Shuuty i organizuj zadania, ludzi, rozmowy, kalendarze i miejsca w jednej aplikacji.',
    },
    images: {
      create: 'Menu tworzenia Shuuty z zadaniem, głosem, spotkaniem i grupą',
      settings: 'Ustawienia Shuuty z kontrolą jasnego motywu i języka',
      groups: 'Mapa Shuuty pokazująca grupy w pobliżu',
      meetings: 'Mapa Shuuty pokazująca spotkanie',
    },
    store: { apple: 'App Store', google: 'Google Play', applePrefix: 'Pobierz z', googlePrefix: 'Pobierz z' },
    footer: {
      tagline: 'Od pomysłu do działania.',
      copyright: '© 2026 Shuuty. Wszelkie prawa zastrzeżone.',
      support: 'Wsparcie',
      privacy: 'Prywatność',
      terms: 'Regulamin',
    },
  },
} as const;

const STORE = {
  android: 'https://play.google.com/store/apps/details?id=com.shuuty.app',
  ios: 'https://apps.apple.com/app/shuuty/id6670202422',
};

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Shuuty',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'iOS, Android',
  url: 'https://shuuty.xyz',
  downloadUrl: [STORE.ios, STORE.android],
  description:
    'Shuuty connects voice-created tasks, immediate delegation, flexible groups, meetings and nearby discovery in one mobile app.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

function Icon({ name }: { name: IconName }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'arrow':
      return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 10h18" /></svg>;
    case 'check':
      return <svg {...props}><path d="m5 12 4 4L19 6" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'community':
      return <svg {...props}><circle cx="8" cy="9" r="3" /><circle cx="17" cy="8" r="2" /><path d="M2.5 19c.7-3.2 2.7-5 5.5-5s4.8 1.8 5.5 5M14 13c3.7-.4 6.1 1.5 6.8 4.5" /></svg>;
    case 'download':
      return <svg {...props}><path d="M12 3v12m-5-5 5 5 5-5M5 21h14" /></svg>;
    case 'group':
      return <svg {...props}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.6-3.7 2.7-5.6 6-5.6s5.4 1.9 6 5.6M15.5 5.5a3 3 0 0 1 0 5.8M16.5 14c2.5.3 4 1.9 4.5 4.5" /></svg>;
    case 'map':
      return <svg {...props}><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></svg>;
    case 'mic':
      return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-4 0h8" /></svg>;
    case 'moon':
      return <svg {...props}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>;
    case 'offer':
      return <svg {...props}><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>;
    case 'people':
      return <svg {...props}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="8.5" r="2.5" /><path d="M2.5 19c.6-3.6 2.5-5.5 5.5-5.5s4.9 1.9 5.5 5.5M14 14c3.7-.7 6.2 1 7 4.5" /></svg>;
    case 'private':
      return <svg {...props}><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
    case 'reminder':
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /><path d="M18.5 3.5 20 2m-14.5 1.5L4 2" /></svg>;
    case 'send':
      return <svg {...props}><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" /><path d="M10.5 13.5 21 3" /></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'task':
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m8 9 1.5 1.5L12 8m-4 7 1.5 1.5L12 14m2-5h2m-2 6h2" /></svg>;
    case 'work':
      return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></svg>;
  }
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={s.storeSvg} aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.storeSvg} aria-hidden>
      <path fill="#4285F4" d="m13 11.6 3-3-9.6-5.3c-.3-.2-.7-.2-1-.1l7.6 8.4Z" />
      <path fill="#34A853" d="m16.4 14.8 3.8-2.2c.6-.3.6-.9 0-1.2l-3.3-1.9-3.2 3.1 2.7 2.2Z" />
      <path fill="#FBBC04" d="M5.3 3.2c-.4.2-.6.6-.6 1.1v15.4c0 .5.2.9.6 1.2l7.7-8.3-7.7-9.4Z" />
      <path fill="#EA4335" d="m13 12.4-7.7 8.3c.4.1.8.1 1.1-.1l9.5-5.4-2.9-2.8Z" />
    </svg>
  );
}

function StoreButton({
  platform,
  label,
  prefix,
  href,
}: {
  platform: 'apple' | 'google';
  label: string;
  prefix: string;
  href: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={s.storeBtn}>
      {platform === 'apple' ? <AppleIcon /> : <PlayIcon />}
      <span className={s.storeBtnText}>
        <span className={s.storeBtnSmall}>{prefix}</span>
        <span className={s.storeBtnName}>{label}</span>
      </span>
    </a>
  );
}

function StoreButtons({ copy }: { copy: (typeof t)['en']['store'] | (typeof t)['pl']['store'] }) {
  return (
    <div className={s.storeRow}>
      <StoreButton platform="apple" label={copy.apple} prefix={copy.applePrefix} href={STORE.ios} />
      <StoreButton platform="google" label={copy.google} prefix={copy.googlePrefix} href={STORE.android} />
    </div>
  );
}

export default function Home() {
  const { language: lang, changeLanguage: switchLang } = useSiteLanguage();
  const [theme, setTheme] = useState<Theme>('dark');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const c = t[lang];

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    const handler = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
      setShowMobileNav(window.scrollY > 640 && !atBottom);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add(s.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = next === 'light' ? '#FFFBF5' : '#0D1117';
      });
      try {
        window.localStorage.setItem('shuuty-theme', next);
      } catch {
        // The selected theme still applies when storage is unavailable.
      }
      return next;
    });
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }}
      />
      <a href="#main" className={s.skipLink}>{c.a11y.skip}</a>
      <div className={s.noiseOverlay} aria-hidden />
      <div className={s.ambient} aria-hidden>
        <span className={s.ambientWarm} />
        <span className={s.ambientCool} />
      </div>

      <header className={s.header}>
        <nav className={s.nav} aria-label={c.a11y.mainNav}>
          <a href="#top" className={s.brand} aria-label="Shuuty">
            <span className={s.brandMark} aria-hidden="true">
              <Image src="/images/brand/shuuty-app-icon.png" alt="" width={40} height={40} priority />
            </span>
            <span className={s.brandName}>Shuuty</span>
          </a>

          <div className={s.navLinks}>
            <a href="#overview">{c.nav.overview}</a>
            <a href="#tasks">{c.nav.tasks}</a>
            <a href="#groups">{c.nav.groups}</a>
            <a href="#discover">{c.nav.discover}</a>
          </div>

          <div className={s.navActions}>
            <button
              type="button"
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
              title={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <div className={s.langSwitch} role="group" aria-label={c.a11y.language}>
              {LANGS.map((item) => (
                <button
                  type="button"
                  key={item.code}
                  className={`${s.langBtn} ${lang === item.code ? s.langActive : ''}`}
                  onClick={() => switchLang(item.code)}
                  aria-pressed={lang === item.code}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <a href="#download" className={s.navCta}>{c.nav.download}</a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="top" className={s.hero}>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}><span className={s.statusDot} />{c.hero.badge}</span>
            <h1 className={s.heroTitle}>
              {c.hero.title}
              <br />
              <span className={s.gradientText}>{c.hero.accent}</span>
            </h1>
            <p className={s.heroLead}>{c.hero.sub}</p>
            <div className={s.heroActions}>
              <StoreButtons copy={c.store} />
              <a href="#overview" className={s.textCta}>
                {c.hero.secondaryCta}<Icon name="arrow" />
              </a>
            </div>
            <ul className={s.signalList}>
              {c.hero.signals.map((signal) => <li key={signal}><Icon name="check" />{signal}</li>)}
            </ul>
          </div>

          <div className={s.heroVisual} role="group" aria-label={c.hero.visualLabel}>
            <div className={`${s.phone} ${s.phoneBackLeft}`}>
              <Image src="/images/app/profile-settings.png" alt={c.images.settings} width={471} height={1024} sizes="(max-width: 720px) 30vw, 190px" />
            </div>
            <div className={`${s.phone} ${s.phoneMain}`}>
              <Image src="/images/app/create-menu.png" alt={c.images.create} width={471} height={1024} priority sizes="(max-width: 720px) 52vw, 290px" />
              <span className={s.phoneHighlight}><Icon name="mic" />{c.hero.voice}</span>
            </div>
            <div className={`${s.phone} ${s.phoneBackRight}`}>
              <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 720px) 30vw, 190px" />
            </div>
            <span className={`${s.orbitBadge} ${s.orbitTask}`}><Icon name="task" />{c.nav.tasks}</span>
            <span className={`${s.orbitBadge} ${s.orbitGroup}`}><Icon name="group" />{c.nav.groups}</span>
            <span className={`${s.orbitBadge} ${s.orbitMap}`}><Icon name="map" />{c.discover.meetings}</span>
          </div>
        </section>

        <section id="overview" className={`${s.section} ${s.reveal}`} data-reveal>
          <div className={s.container}>
            <div className={s.sectionIntro}>
              <span className={s.sectionLabel}>{c.overview.label}</span>
              <h2>{c.overview.heading}</h2>
              <p>{c.overview.lead}</p>
            </div>
            <div className={s.pillarGrid}>
              {c.overview.items.map((item) => (
                <a key={item.kicker} href={item.href} className={s.pillarCard}>
                  <span className={s.pillarTop}><span>{item.kicker}</span><Icon name={item.icon} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className={s.cardArrow}><Icon name="arrow" /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="tasks" className={`${s.chapter} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid}`}>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.tasks.label}</span>
              <h2>{c.tasks.heading}</h2>
              <p className={s.chapterLead}>{c.tasks.lead}</p>
              <ul className={s.bulletList}>
                {c.tasks.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
            </div>

            <div className={s.productCanvas}>
              <div className={s.canvasGlow} aria-hidden />
              <div className={s.voiceDemo}>
                <div className={s.demoHeader}>
                  <span className={s.demoIcon}><Icon name="mic" /></span>
                  <span>{c.tasks.voiceLabel}</span>
                  <span className={s.livePill}><i />AI</span>
                </div>
                <blockquote>{c.tasks.voicePrompt}</blockquote>
                <div className={s.voiceWave} aria-hidden>{[10, 18, 12, 28, 20, 34, 14, 24, 11, 20, 8].map((height, index) => <i key={index} style={{ height }} />)}</div>
                <div className={s.parsedTask}>
                  <span className={s.parsedLabel}>{c.tasks.parsedLabel}</span>
                  <div className={s.parsedTitle}><span className={s.taskCheck}><Icon name="task" /></span><strong>{c.tasks.parsedTitle}</strong></div>
                  <div className={s.metaChips}>
                    {c.tasks.parsedMeta.map((meta, index) => (
                      <span key={meta}><Icon name={index === 0 ? 'clock' : index === 1 ? 'people' : 'reminder'} />{meta}</span>
                    ))}
                  </div>
                  <span className={s.delegateDemo}><Icon name="send" />{c.tasks.delegate}</span>
                  <p className={s.deliveryNote}>{c.tasks.deliveryNote}</p>
                </div>
              </div>
              <ol className={s.miniFlow}>
                {c.tasks.flow.map((step, index) => (
                  <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="groups" className={`${s.chapter} ${s.chapterTint} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid} ${s.reverseGrid}`}>
            <div className={s.groupsVisual}>
              <div className={`${s.phone} ${s.groupPhone}`}>
                <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 960px) 230px, 270px" />
              </div>
              <div className={s.groupModes}>
                <span className={s.modesLabel}>{c.groups.modesLabel}</span>
                {c.groups.modes.map((mode) => (
                  <div key={mode.title} className={s.groupModeCard}>
                    <span><Icon name={mode.icon} /></span>
                    <div><strong>{mode.title}</strong><p>{mode.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.groups.label}</span>
              <h2>{c.groups.heading}</h2>
              <p className={s.chapterLead}>{c.groups.lead}</p>
              <ul className={s.bulletList}>
                {c.groups.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="discover" className={`${s.chapter} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid}`}>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.discover.label}</span>
              <h2>{c.discover.heading}</h2>
              <p className={s.chapterLead}>{c.discover.lead}</p>
              <ul className={s.bulletList}>
                {c.discover.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
              <article className={s.mapStory}>
                <span className={s.mapStoryLabel}><Icon name="map" />{c.discover.map.label}</span>
                <h3>{c.discover.map.heading}</h3>
                <p>{c.discover.map.lead}</p>
                <ul>
                  {c.discover.map.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </article>
            </div>
            <div className={s.mapVisual}>
              <div className={s.mapCaption}><span><Icon name="map" /></span>{c.discover.mapCaption}</div>
              <figure className={`${s.phone} ${s.mapPhoneLeft}`}>
                <Image src="/images/app/discover-meetings.png" alt={c.images.meetings} width={471} height={1024} sizes="(max-width: 720px) 48vw, 250px" />
                <figcaption>{c.discover.meetings}</figcaption>
              </figure>
              <figure className={`${s.phone} ${s.mapPhoneRight}`}>
                <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 720px) 48vw, 250px" />
                <figcaption>{c.discover.groups}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.flowSection} ${s.reveal}`} data-reveal>
          <div className={s.container}>
            <div className={s.sectionIntro}>
              <span className={s.sectionLabel}>{c.flow.label}</span>
              <h2>{c.flow.heading}</h2>
              <p>{c.flow.lead}</p>
            </div>
            <div className={s.flowGrid}>
              {c.flow.items.map((item, index) => (
                <div key={item.title} className={s.flowCard}>
                  <span className={s.flowNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={s.flowIcon}><Icon name={item.icon} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  {index < c.flow.items.length - 1 && <span className={s.flowArrow}><Icon name="arrow" /></span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.faqSection} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.faqLayout}`}>
            <div className={s.faqIntro}>
              <span className={s.sectionLabel}>{c.faq.label}</span>
              <h2>{c.faq.heading}</h2>
            </div>
            <div className={s.faqList}>
              {c.faq.items.map((item, index) => {
                const isOpen = openFaq === index;
                const panelId = `faq-panel-${index}`;
                return (
                  <div key={item.q} className={`${s.faqItem} ${isOpen ? s.faqOpen : ''}`}>
                    <button
                      type="button"
                      className={s.faqQuestion}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span>{item.q}</span>
                      <i aria-hidden>{isOpen ? '−' : '+'}</i>
                    </button>
                    <div id={panelId} className={s.faqAnswer} aria-hidden={!isOpen}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="download" className={`${s.cta} ${s.reveal}`} data-reveal>
          <div className={s.ctaGlow} aria-hidden />
          <div className={s.ctaInner}>
            <span className={s.sectionLabel}>{c.cta.eyebrow}</span>
            <h2>{c.cta.heading}</h2>
            <p>{c.cta.sub}</p>
            <StoreButtons copy={c.store} />
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <span className={s.brandMark} aria-hidden="true">
              <Image src="/images/brand/shuuty-app-icon.png" alt="" width={34} height={34} />
            </span>
            <div><strong>SHUUTY</strong><span>{c.footer.tagline}</span></div>
          </div>
          <span className={s.footerCopy}>{c.footer.copyright}</span>
          <nav className={s.footerLinks} aria-label={c.a11y.footerNav}>
            <Link href="/support">{c.footer.support}</Link>
            <Link href="/privacy">{c.footer.privacy}</Link>
            <Link href="/terms">{c.footer.terms}</Link>
          </nav>
        </div>
      </footer>

      <nav className={`${s.mobileNav} ${showMobileNav ? s.mobileNavVisible : ''}`} aria-label={c.a11y.mainNav}>
        <a href="#tasks" aria-label={c.nav.tasks}><Icon name="task" /></a>
        <a href="#groups" aria-label={c.nav.groups}><Icon name="group" /></a>
        <a href="#discover" aria-label={c.nav.discover}><Icon name="map" /></a>
        <a href="#download" className={s.mobileDownload} aria-label={c.nav.download}><Icon name="download" /></a>
      </nav>
    </>
  );
}
