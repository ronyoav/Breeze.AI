"use client";

import { useState, useEffect } from "react";
import WelcomeScreen from "./WelcomeScreen";
import { Q_Departure, Q_Dates, Q_Composition, Q_Budget } from "./QuestionScreens";
import PreferencesScreen from "./PreferencesScreen";
import GeneratingScreen from "./GeneratingScreen";
import ItineraryScreen from "./ItineraryScreen";
import type { TripAnswers, Screen } from "./types";

const QUESTION_FLOW: Screen[] = ["q-departure", "q-dates", "q-composition", "q-budget"];

export default function BreezeApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [dark, setDark] = useState(false);
  const [answers, setAnswers] = useState<TripAnswers>({
    destination: "",
    dates: { start: "Jun 10", end: "Jun 17", days: 7 },
    composition: null,
    budget: "comfort",
    interests: [],
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDark = () => setDark((d) => !d);
  const setAnswer = <K extends keyof TripAnswers>(key: K, value: TripAnswers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const goTo = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleAdvance = () => {
    const cur = QUESTION_FLOW.indexOf(screen);
    if (cur === -1) return;
    if (cur < QUESTION_FLOW.length - 1) goTo(QUESTION_FLOW[cur + 1]);
    else goTo("preferences");
  };

  const handleBack = () => {
    const cur = QUESTION_FLOW.indexOf(screen);
    if (cur > 0) goTo(QUESTION_FLOW[cur - 1]);
    else if (cur === 0) goTo("welcome");
    else if (screen === "preferences") goTo("q-budget");
  };

  const sharedProps = { dark, onToggle: toggleDark };

  if (screen === "welcome")
    return <WelcomeScreen onStart={() => goTo("q-departure")} {...sharedProps} />;

  if (screen === "q-departure")
    return (
      <Q_Departure
        value={answers.destination}
        onChange={(v) => setAnswer("destination", v)}
        onAdvance={handleAdvance}
        onBack={() => goTo("welcome")}
        stepIdx={0}
        total={4}
        {...sharedProps}
      />
    );

  if (screen === "q-dates")
    return (
      <Q_Dates
        value={answers.dates}
        onChange={(v) => setAnswer("dates", v)}
        onAdvance={handleAdvance}
        onBack={handleBack}
        stepIdx={1}
        total={4}
        {...sharedProps}
      />
    );

  if (screen === "q-composition")
    return (
      <Q_Composition
        value={{ comp: answers.composition, ages: answers.ages || "" }}
        onChange={(v) => {
          setAnswer("composition", v.comp);
          setAnswer("ages", v.ages);
        }}
        onAdvance={handleAdvance}
        onBack={handleBack}
        stepIdx={2}
        total={4}
        {...sharedProps}
      />
    );

  if (screen === "q-budget")
    return (
      <Q_Budget
        value={answers.budget}
        onChange={(v) => setAnswer("budget", v)}
        onAdvance={handleAdvance}
        onBack={handleBack}
        stepIdx={3}
        total={4}
        {...sharedProps}
      />
    );

  if (screen === "preferences")
    return (
      <PreferencesScreen
        value={answers.interests}
        onChange={(v) => setAnswer("interests", v)}
        onAdvance={() => goTo("generating")}
        onBack={handleBack}
        {...sharedProps}
      />
    );

  if (screen === "generating")
    return (
      <GeneratingScreen
        answers={answers}
        onDone={() => goTo("itinerary")}
        {...sharedProps}
      />
    );

  if (screen === "itinerary")
    return (
      <ItineraryScreen
        answers={answers}
        onRestart={() => goTo("welcome")}
        {...sharedProps}
      />
    );

  return null;
}
