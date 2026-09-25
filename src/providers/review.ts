export function reviewAnswer(answer: string) {
  const text = answer.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const hasAction =
    /\bI\s+(?:built|created|designed|implemented|tested|led|wrote|fixed|measured|compared|chose|organized|developed|reviewed|used|worked|helped|decided)\b/i.test(
      text,
    );
  const hasReason =
    /\b(because|so that|in order to|tradeoff|trade-off|instead of)\b/i.test(
      text,
    );
  const hasResult =
    /\b(result|outcome|improved|reduced|increased|learned|measured|observed|delivered)\b|\d+\s*%/i.test(
      text,
    );
  const observations: string[] = [];
  const nextSteps: string[] = [];
  if (hasAction)
    observations.push(
      "You describe a personal action. Check that it matches your actual contribution.",
    );
  else
    nextSteps.push(
      "Name your own contribution with an action such as ‘I tested’ or ‘I designed’.",
    );
  if (hasReason)
    observations.push(
      "You include a reason or tradeoff. Make the alternatives clear.",
    );
  else
    nextSteps.push("Explain why you chose that approach over an alternative.");
  if (hasResult)
    observations.push(
      "You mention an outcome or learning. Support it with evidence you can verify.",
    );
  else
    nextSteps.push(
      "Add the observed outcome or what you learned. Do not invent a metric.",
    );
  if (words < 30)
    nextSteps.push(
      "This answer is brief. Add enough context for someone unfamiliar with your work.",
    );
  if (words > 250)
    nextSteps.push(
      "Consider a shorter first answer, then offer more detail if asked.",
    );
  return {
    words,
    observations,
    nextSteps,
    followUp: !hasAction
      ? "What part did you personally own?"
      : !hasReason
        ? "Why did you choose that approach?"
        : !hasResult
          ? "What evidence showed whether it worked?"
          : "What would you change if you did it again?",
  };
}
export function meetingNotes(notes: string[]) {
  return {
    actions: notes.filter((n) =>
      /^\s*(action|follow[- ]?up|next step)\s*:/i.test(n),
    ),
    decisions: notes.filter((n) =>
      /^\s*(decision|decided|agreed)\s*:/i.test(n),
    ),
  };
}
