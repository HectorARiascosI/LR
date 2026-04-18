/// <reference types="react" />
/// <reference types="react-dom" />

/**
 * Shim de tipos para el IDE (language server).
 * Resuelve el problema de @types/react v18/19 con `export = React`
 * que el IDE no resuelve correctamente como named exports.
 */

// ── Named exports de React ──
declare module "react" {
  export const useState: (typeof import("react"))["useState"];
  export const useEffect: (typeof import("react"))["useEffect"];
  export const useRef: (typeof import("react"))["useRef"];
  export const useMemo: (typeof import("react"))["useMemo"];
  export const useCallback: (typeof import("react"))["useCallback"];
  export const useContext: (typeof import("react"))["useContext"];
  export const useReducer: (typeof import("react"))["useReducer"];
  export const useLayoutEffect: (typeof import("react"))["useLayoutEffect"];
  export const useId: (typeof import("react"))["useId"];
  export const useTransition: (typeof import("react"))["useTransition"];
  export const useDeferredValue: (typeof import("react"))["useDeferredValue"];
  export const useImperativeHandle: (typeof import("react"))["useImperativeHandle"];
  export const useDebugValue: (typeof import("react"))["useDebugValue"];
  export const useInsertionEffect: (typeof import("react"))["useInsertionEffect"];
  export const useSyncExternalStore: (typeof import("react"))["useSyncExternalStore"];
  export const Suspense: (typeof import("react"))["Suspense"];
  export const Fragment: (typeof import("react"))["Fragment"];
  export const StrictMode: (typeof import("react"))["StrictMode"];
  export const createContext: (typeof import("react"))["createContext"];
  export const createRef: (typeof import("react"))["createRef"];
  export const forwardRef: (typeof import("react"))["forwardRef"];
  export const memo: (typeof import("react"))["memo"];
  export const lazy: (typeof import("react"))["lazy"];
  export const createElement: (typeof import("react"))["createElement"];
  export const cloneElement: (typeof import("react"))["cloneElement"];
  export const isValidElement: (typeof import("react"))["isValidElement"];
  export const Children: (typeof import("react"))["Children"];
}
