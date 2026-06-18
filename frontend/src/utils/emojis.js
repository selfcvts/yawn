// Popular emojis from emoji.gg for reactions
export const EMOJI_GG_REACTIONS = [
  { name: "fire", url: "https://emoji.gg/assets/emoji/3700-fire.png", category: "positive" },
  { name: "skull", url: "https://emoji.gg/assets/emoji/7219-skull.png", category: "negative" },
  { name: "clap", url: "https://emoji.gg/assets/emoji/7674_clap.png", category: "positive" },
  { name: "heart", url: "https://emoji.gg/assets/emoji/2122_GWqlabsHyperLove.png", category: "positive" },
  { name: "laugh", url: "https://emoji.gg/assets/emoji/6486_cat_laugh.png", category: "positive" },
  { name: "cry", url: "https://emoji.gg/assets/emoji/9006_sob.png", category: "negative" },
  { name: "thinking", url: "https://emoji.gg/assets/emoji/4681_thinking.png", category: "neutral" },
  { name: "thumbsup", url: "https://emoji.gg/assets/emoji/3415-thumbsup.png", category: "positive" },
  { name: "thumbsdown", url: "https://emoji.gg/assets/emoji/4544-thumbsdown.png", category: "negative" },
  { name: "pog", url: "https://emoji.gg/assets/emoji/6666_PogChamp.png", category: "positive" },
  { name: "monkas", url: "https://emoji.gg/assets/emoji/8329_MonkaS.png", category: "negative" },
  { name: "pepehands", url: "https://emoji.gg/assets/emoji/3675_PepeHands.png", category: "negative" },
  { name: "kek", url: "https://emoji.gg/assets/emoji/7363_kek.png", category: "positive" },
  { name: "chad", url: "https://emoji.gg/assets/emoji/8846_chad.png", category: "positive" },
  { name: "cringe", url: "https://emoji.gg/assets/emoji/9893-pleading-face.png", category: "negative" },
];

export function getEmojiUrl(name) {
  const emoji = EMOJI_GG_REACTIONS.find(e => e.name === name);
  return emoji ? emoji.url : null;
}
