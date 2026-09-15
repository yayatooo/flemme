import { z } from "zod";

export const kitchenEquipmentKeys = [
	"stove",
	"induction-cooker",
	"oven",
	"air-fryer",
	"microwave",
	"rice-cooker",
	"frying-pan",
	"wok",
	"pot",
	"saucepan",
	"blender",
	"food-processor",
	"mixer",
	"steamer",
	"grill",
	"toaster",
	"kettle",
	"pressure-cooker",
	"slow-cooker",
] as const;

export const KitchenEquipmentKeySchema = z.enum(kitchenEquipmentKeys);
export type KitchenEquipmentKey = z.infer<typeof KitchenEquipmentKeySchema>;

export type KitchenEquipmentCategory =
	| "cooking-heat"
	| "cookware"
	| "preparation"
	| "cooking-method"
	| "utility";

export interface KitchenEquipmentDefinition {
	key: KitchenEquipmentKey;
	label: string;
	category: KitchenEquipmentCategory;
}

export const kitchenEquipmentCatalog = [
	{ key: "stove", label: "Stove", category: "cooking-heat" },
	{
		key: "induction-cooker",
		label: "Induction Cooker",
		category: "cooking-heat",
	},
	{ key: "oven", label: "Oven", category: "cooking-heat" },
	{ key: "air-fryer", label: "Air Fryer", category: "cooking-heat" },
	{ key: "microwave", label: "Microwave", category: "cooking-heat" },
	{ key: "rice-cooker", label: "Rice Cooker", category: "cooking-heat" },
	{ key: "frying-pan", label: "Frying Pan", category: "cookware" },
	{ key: "wok", label: "Wok", category: "cookware" },
	{ key: "pot", label: "Pot", category: "cookware" },
	{ key: "saucepan", label: "Saucepan", category: "cookware" },
	{ key: "blender", label: "Blender", category: "preparation" },
	{
		key: "food-processor",
		label: "Food Processor",
		category: "preparation",
	},
	{ key: "mixer", label: "Mixer", category: "preparation" },
	{ key: "steamer", label: "Steamer", category: "cooking-method" },
	{ key: "grill", label: "Grill", category: "cooking-method" },
	{ key: "toaster", label: "Toaster", category: "cooking-method" },
	{ key: "kettle", label: "Kettle", category: "utility" },
	{
		key: "pressure-cooker",
		label: "Pressure Cooker",
		category: "utility",
	},
	{
		key: "slow-cooker",
		label: "Slow Cooker",
		category: "utility",
	},
] as const satisfies ReadonlyArray<KitchenEquipmentDefinition>;
