"use client";

import { useState, useEffect } from "react";
import WelcomeScreen from "./WelcomeScreen";
import { Q_Name, Q_Departure, Q_Dates, Q_Composition, Q_Budget } from "./QuestionScreens";
import PreferencesScreen from "./PreferencesScreen";
import GeneratingScreen from "./GeneratingScreen";
import ItineraryScreen from "./ItineraryScreen";
import type { TripAnswers, Screen, GeneratedItinerary } from "./types";

const QUESTION_FLOW: Screen[] = ["q-name", "q-departure", "q-dates", "q-composition", "q-budget"];

export default function BreezeApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [dark, setDark] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary>({ days: [] });
  const [answers, setAnswers] = useState<TripAnswers>(() => {
    const today = new Date();
    const plusWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      userName: "",
      destination: "",
      country: "",
      dates: {
        start: today.toISOString().split("T")[0],
        end: plusWeek.toISOString().split("T")[0],
        days: 8,
      },
      composition: null,
      travelers: [],
      budget: "comfort",
      interests: [],
    };
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
  const total = QUESTION_FLOW.length;

  if (screen === "welcome")
    return <WelcomeScreen onStart={() => goTo("q-name")} {...sharedProps} />;

  if (screen === "q-name")
    return (
      <Q_Name
        value={answers.userName}
        onChange={(v) => setAnswer("userName", v)}
        onAdvance={handleAdvance}
        onBack={() => goTo("welcome")}
        stepIdx={0}
        total={total}
        {...sharedProps}
      />
    );

  if (screen === "q-departure")
    return (
      <Q_Departure
        value={answers.destination}
        onChange={(city, country) => {
          setAnswer("destination", city);
          setAnswer("country", country);
        }}
        onAdvance={handleAdvance}
        onBack={handleBack}
        stepIdx={1}
        total={total}
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
        stepIdx={2}
        total={total}
        {...sharedProps}
      />
    );

  if (screen === "q-composition")
    return (
      <Q_Composition
        value={{ comp: answers.composition, travelers: answers.travelers }}
        onChange={(v) => {
          setAnswer("composition", v.comp);
          setAnswer("travelers", v.travelers);
        }}
        onAdvance={handleAdvance}
        onBack={handleBack}
        stepIdx={3}
        total={total}
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
        stepIdx={4}
        total={total}
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
        onDone={(itinerary) => {
          setGeneratedItinerary(itinerary);
          goTo("itinerary");
        }}
        {...sharedProps}
      />
    );

  if (screen === "itinerary")
    return (
      <ItineraryScreen
        answers={answers}
        generatedItinerary={generatedItinerary}
        onRestart={() => {
          setGeneratedItinerary({ days: [] });
          goTo("welcome");
        }}
        onUpdate={(itinerary) => setGeneratedItinerary(itinerary)}
        {...sharedProps}
      />
    );

  return null;
}
