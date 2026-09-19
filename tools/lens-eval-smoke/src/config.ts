const REQUIRED_VARIABLES = [
	"ANVIA_LENS_BASE_URL",
	"ANVIA_LENS_PUBLIC_KEY",
	"ANVIA_LENS_SECRET_KEY",
	"ANVIA_LENS_SERVICE_NAME",
	"ANVIA_LENS_ENVIRONMENT",
] as const;

const LOCAL_LENS_BASE_URL = "http://127.0.0.1:18080";

export interface LensSmokeConfig {
	baseUrl: string;
	publicKey: string;
	secretKey: string;
	serviceName: string;
	environment: string;
}

export class LensSmokeConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LensSmokeConfigurationError";
	}
}

export function resolveLensSmokeConfig(
	environment: Readonly<Record<string, string | undefined>>,
): LensSmokeConfig {
	const values = new Map<string, string>();
	for (const name of REQUIRED_VARIABLES) {
		const value = environment[name]?.trim();
		if (!value) {
			throw new LensSmokeConfigurationError(
				`Missing required Lens smoke configuration: ${name}`,
			);
		}
		values.set(name, value);
	}

	const baseUrl = values.get("ANVIA_LENS_BASE_URL");
	if (baseUrl !== LOCAL_LENS_BASE_URL) {
		throw new LensSmokeConfigurationError(
			`Lens smoke base URL must be ${LOCAL_LENS_BASE_URL}`,
		);
	}

	return {
		baseUrl,
		publicKey: requiredValue(values, "ANVIA_LENS_PUBLIC_KEY"),
		secretKey: requiredValue(values, "ANVIA_LENS_SECRET_KEY"),
		serviceName: requiredValue(values, "ANVIA_LENS_SERVICE_NAME"),
		environment: requiredValue(values, "ANVIA_LENS_ENVIRONMENT"),
	};
}

function requiredValue(values: ReadonlyMap<string, string>, name: string) {
	const value = values.get(name);
	if (value === undefined) {
		throw new LensSmokeConfigurationError(
			`Missing required Lens smoke configuration: ${name}`,
		);
	}
	return value;
}
