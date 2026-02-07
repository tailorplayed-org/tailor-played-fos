// Mock CSS module — returns property name as class name value
const handler: ProxyHandler<Record<string, string>> = {
  get(_, prop: string) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy({}, handler);
    return String(prop);
  },
};

export default new Proxy({}, handler);
