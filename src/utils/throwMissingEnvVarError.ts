export default function throwMissingEnvVarError(variableName: string): string {
  throw new Error(`Missing env var ${variableName}`);
}
