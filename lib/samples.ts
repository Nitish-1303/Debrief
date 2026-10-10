// Two built-in sample transcripts for the demo: one English, one Hinglish-mixed.
// Both are fictional and non-sensitive. Each has a mix of commitments with
// stated owners/deadlines and some deliberately missing — to show the honest
// "stated / missing" fields and the verifier at work.

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
    text: `Rohan: Chalo shuru karte hain. Main kal tak client ko proposal bhej dunga.
Sana: Theek hai. Website ka content update karna hai before Friday — koi lega?
Rohan: Sana, aap analytics dashboard set up kar sakti ho by Wednesday?
Sana: Haan, I'll set up the analytics dashboard by Wednesday.
Rohan: Aur ek demo video bhi banani hai, but abhi owner decide nahi hua.`,
  },
];
