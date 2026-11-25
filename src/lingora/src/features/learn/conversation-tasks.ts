import { exchangeInvitation, exchangeTask } from '@/features/chats/exchange-table';
import { adventureTasks } from './zurich-adventure';
import { swissMissions } from './swiss-missions';

type ConversationTask = { goal: string; starter: string };

const openers: Record<string, string> = {
  de: 'Hallo! Hast du Lust auf einen kurzen Sprachaustausch? Worüber möchtest du sprechen?',
  en: 'Hi! Would you like to practise together? What would you like to talk about?',
  es: '¡Hola! ¿Te apetece practicar juntos? ¿De qué te gustaría hablar?',
  fr: 'Salut ! Ça te dit de pratiquer ensemble ? De quoi aimerais-tu parler ?',
  it: 'Ciao! Ti va di fare un po’ di pratica insieme? Di che cosa ti piacerebbe parlare?',
  pl: 'Cześć! Masz ochotę razem poćwiczyć? O czym chcesz porozmawiać?',
  ru: 'Привет! Хочешь немного попрактиковаться вместе? О чём тебе хотелось бы поговорить?',
  gsw: 'Hoi! Häsch Luscht uf en Sprachaustusch? Über was würdsch gärn rede?',
};

const workshops: Record<string, ConversationTask> = {
  'de-r17': {
    goal: 'Take opposite sides on whether a library should stay open later. Agree on one condition for a trial.',
    starter: 'Wollen wir über längere Öffnungszeiten diskutieren? Ich bin dafür, sofern die Spätdienste planbar bleiben. Wie siehst du das?',
  },
  'de-r18': {
    goal: 'Play the project lead and the client. Confirm one delivery and politely negotiate a new deadline for the rest.',
    starter: 'Guten Tag, die Übersicht kann ich Ihnen am Freitag schicken. Wäre Dienstag für den vollständigen Bericht für Sie möglich?',
  },
  'de-r19': {
    goal: 'Defend two different ways to measure a traffic trial. Find one criterion you can both accept.',
    starter: 'Am Ufer ist es ruhiger geworden. Reicht dir das als Erfolgskriterium, oder sollten wir den Verkehr im ganzen Quartier messen?',
  },
  'de-r20': {
    goal: 'Act as a reporter and an analyst. Agree on a headline that makes the result and its limits clear.',
    starter: 'Dürfen wir schreiben, dass sich das Projekt selbst finanziert hat? Welche Kosten müssten wir dafür einrechnen?',
  },
};

export function conversationTask(id: string | undefined): ConversationTask | undefined {
  if (!id) return;
  const exchange = exchangeTask(id);
  if (exchange) return {
    goal: exchange.goal,
    starter: exchangeInvitation(exchange.id, `Would you like to practise with the Exchange table? Situation: ${exchange.title}. I’ll take role A if you take role B. Then we swap roles and languages.`),
  };
  if (Object.hasOwn(adventureTasks, id)) return adventureTasks[id];
  const mission = swissMissions.find(item => id === `swiss-${item.id}`);
  if (mission) return { goal: mission.goal, starter: `Hast du Lust auf ein Rollenspiel? ${mission.roleplay}` };
  if (Object.hasOwn(workshops, id)) return workshops[id];
  if (Object.hasOwn(openers, id)) {
    return { goal: 'Ask your partner a follow-up question and try one expression from the lesson.', starter: openers[id] };
  }
}
