import { Clock3, Dumbbell, Refrigerator, UsersRound } from "lucide-react";

export const quickStartOptions = [
	{
		label: "Use what's in my fridge",
		request: "Suggest something using what I already have.",
		icon: Refrigerator,
	},
	{
		label: "Something quick",
		request: "Something quick.",
		icon: Clock3,
	},
	{
		label: "For the family",
		request: "A meal for the family.",
		icon: UsersRound,
	},
	{
		label: "High protein",
		request: "Something high in protein.",
		icon: Dumbbell,
	},
] as const;
