// SPA shim for @tanstack/react-start/server — server-only helpers become no-ops.
export function getRequest(): null {
  return null;
}
export function getRequestHeader(_name: string): null {
  return null;
}
export function setResponseHeaders(_headers: Headers): void {}
export function setResponseHeader(_name: string, _value: string): void {}
export function setResponseStatus(_code: number): void {}
