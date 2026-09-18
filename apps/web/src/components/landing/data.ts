export const recipeCards = [
	{
		name: "Nasi goreng sayur",
		detail: "Quick · one pan",
		description:
			"A practical fried rice built around leftover rice and vegetables already in your kitchen.",
		estimatedDuration: "20 min",
		art: "bg-mustard",
		image: {
			src: "/nasi-goreng.jpeg",
			alt: "A plate of nasi goreng topped with sliced green onions",
		},
		nutrition: {
			calories: 420,
			protein: 18,
		},
	},
	{
		name: "Ayam kecap",
		detail: "Comforting · savory",
		description:
			"A warm, savory chicken dish with sweet soy sauce and simple everyday ingredients.",
		estimatedDuration: "35 min",
		art: "bg-soft-pink",
		image: {
			src: "/ayam-kecap.jpeg",
			alt: "Ayam kecap with onions, chilies, and herbs in a savory sauce",
		},
		nutrition: {
			calories: 510,
			protein: 34,
		},
	},
	{
		name: "Pasta sambal",
		detail: "Spicy · easy",
		description:
			"A quick pasta with a spicy Indonesian twist for when dinner needs a little more character.",
		estimatedDuration: "25 min",
		art: "bg-lavender",
		image: {
			src: "/Creamy-Sambal-Pasta-Recipe.jpg",
			alt: "Creamy sambal pasta garnished with herbs and cucumber",
		},
		nutrition: {
			calories: 460,
			protein: 16,
		},
	},
] as const;

export type LandingRecipe = (typeof recipeCards)[number];

export const tickerStatements = [
	{ id: "question-a", text: "What’s in your fridge?" },
	{ id: "cook-a", text: "Let’s cook" },
	{ id: "decide-a", text: "No more “makan apa ya?”" },
	{ id: "use-a", text: "Cook what you have" },
	{ id: "question-b", text: "What’s in your fridge?" },
	{ id: "cook-b", text: "Let’s cook" },
	{ id: "decide-b", text: "No more “makan apa ya?”" },
	{ id: "use-b", text: "Cook what you have" },
] as const;

export const journey = [
	["01", "Tell us what you have", "Ingredients on hand, not a perfect pantry."],
	["02", "Pick a meal", "Choose the idea that sounds good tonight."],
	["03", "Prepare", "Get everything ready before the pan gets hot."],
	["04", "Cook together", "Follow one clear, useful step at a time."],
] as const;
