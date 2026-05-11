import { resolveApiKeys } from "../shared/config";
import type { EndpointConfig, ResolvedEndpoint } from "../shared/types";

export function loadEndpoints(endpoints: EndpointConfig[]): ResolvedEndpoint[] {
  return resolveApiKeys(endpoints);
}
