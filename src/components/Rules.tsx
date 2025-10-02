import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface RulesProps {
  language: "en" | "ru";
}

const translations = {
  en: {
    title: "Game Rules & How to Play",
    casesTitle: "Opening Cases",
    casesContent: "Use Soul to open cases and get nails of different rarities. Each case costs 50 Soul. You can get Common, Rare, Epic, or Legendary nails, with a small chance to get a Dream version!",
    combatTitle: "Combat System",
    combatContent: "Fight enemies using your nails. Each battle costs 1 Mask. Hit the green zone for perfect damage, yellow for good damage, or red for weak damage. Win battles to earn Soul and Dream Points (in Dream Battles).",
    currencyTitle: "Currency System",
    currencyContent: "Soul: Main currency earned from combat. Use it to open cases and buy items. Dream Points: Premium currency earned from Dream Battles and rare drops. Use it for special purchases. Masks: Required to enter battles. Buy more from the shop.",
    conversionTitle: "Currency Conversion",
    conversionContent: "Convert Soul to Dream Points: 100 Soul = 1 Dream Point. When converting Soul to Dream Points, enter the number of exchanges you want (e.g., 5 exchanges = 500 Soul → 5 Dream Points). Convert Dream Points to Soul: 1 Dream Point = 100 Soul.",
    tradeTitle: "Trading System",
    tradeContent: "Create trade links to share nails with other players. Generate a unique code and share it. The recipient can claim the nail once. Trade links expire after being claimed.",
    dreamNailsTitle: "Dream Nails",
    dreamNailsContent: "Dream Nails are special versions with glowing effects. They allow you to enter Dream Battles for better rewards. Dream Battles give both Soul and Dream Points. Keep rare Dream Nails as trophies!",
  },
  ru: {
    title: "Правила Игры и Как Играть",
    casesTitle: "Открытие Кейсов",
    casesContent: "Используйте Душу для открытия кейсов и получения гвоздей разной редкости. Каждый кейс стоит 50 Души. Вы можете получить Обычные, Редкие, Эпические или Легендарные гвозди, с небольшим шансом получить версию Снов!",
    combatTitle: "Система Боя",
    combatContent: "Сражайтесь с врагами, используя свои гвозди. Каждая битва стоит 1 Маску. Попадите в зеленую зону для идеального урона, желтую для хорошего урона, или красную для слабого урона. Побеждайте в битвах, чтобы заработать Душу и Очки Снов (в Битвах Снов).",
    currencyTitle: "Система Валют",
    currencyContent: "Душа: Основная валюта, заработанная в бою. Используйте её для открытия кейсов и покупки предметов. Очки Снов: Премиум валюта, заработанная в Битвах Снов и редких дропах. Используйте её для особых покупок. Маски: Требуются для входа в битвы. Купите больше в магазине.",
    conversionTitle: "Конвертация Валют",
    conversionContent: "Конвертация Души в Очки Снов: 100 Души = 1 Очко Снов. При конвертации Души в Очки Снов введите количество обменов (например, 5 обменов = 500 Души → 5 Очков Снов). Конвертация Очков Снов в Душу: 1 Очко Снов = 100 Души.",
    tradeTitle: "Система Обмена",
    tradeContent: "Создавайте торговые ссылки для обмена гвоздями с другими игроками. Сгенерируйте уникальный код и поделитесь им. Получатель может забрать гвоздь один раз. Торговые ссылки истекают после получения.",
    dreamNailsTitle: "Гвозди Снов",
    dreamNailsContent: "Гвозди Снов - это особые версии с эффектом свечения. Они позволяют вам входить в Битвы Снов для лучших наград. Битвы Снов дают и Душу, и Очки Снов. Храните редкие Гвозди Снов как трофеи!",
  },
};

export const Rules = ({ language }: RulesProps) => {
  const t = translations[language];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{t.title}</h2>
      
      <Card className="p-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cases">
            <AccordionTrigger className="text-lg font-semibold">
              {t.casesTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.casesContent}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="combat">
            <AccordionTrigger className="text-lg font-semibold">
              {t.combatTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.combatContent}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="currency">
            <AccordionTrigger className="text-lg font-semibold">
              {t.currencyTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.currencyContent}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="conversion">
            <AccordionTrigger className="text-lg font-semibold">
              {t.conversionTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.conversionContent}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trade">
            <AccordionTrigger className="text-lg font-semibold">
              {t.tradeTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.tradeContent}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dreamnails">
            <AccordionTrigger className="text-lg font-semibold">
              {t.dreamNailsTitle}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t.dreamNailsContent}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};