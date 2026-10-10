// Built-in sample transcripts for the demo. All fictional and non-sensitive.
// They deliberately mix stated owners/deadlines with missing ones, so the
// honest "stated / missing" fields and the verifier are both visible.

export interface Sample {
  label: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    label: "English sample",
    text: `Priya: Morning everyone. I'll send the Q3 budget to the finance team by Friday.
Arjun: Thanks. We still need someone to update the landing page copy before the launch.
Priya: Arjun, can you book the vendor call for next Tuesday?
Arjun: Sure, I'll set up the vendor call for Tuesday and send the invite.
Meera: I can take the landing page copy — I'll have a draft ready by Thursday.
Arjun: Great. We should also get the pricing page reviewed, but we'll figure out who later.`,
  },
  {
    label: "Hinglish sample",
    text: `Rohan: Chalo shuru karte hain. Main kal tak client ko updated proposal bhej dunga.
Sana: Perfect. Website ka content refresh karna hai before Friday — but abhi koi owner nahi hai.
Rohan: Sana, aap Wednesday tak analytics dashboard set up kar sakti ho?
Sana: Haan, I'll set up the analytics dashboard by Wednesday, no problem.
Priya: Main design review Thursday ko kar dungi.
Rohan: Aur ek demo video bhi chahiye launch ke liye, par woh kaun banayega abhi decide nahi hua.`,
  },
  {
    label: "Vague sample (adversarial)",
    text: `We should probably look into the onboarding flow at some point.
Someone mentioned the docs feel a little out of date.
It'd be good to improve test coverage eventually.
There was some talk about revisiting pricing, but nothing was decided.
Let's keep the mobile app idea on the radar for now.`,
  },
];
