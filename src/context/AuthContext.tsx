import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User; session: Session }
  | { status: "unauthenticated" };

type AuthAction =
  | { type: "LOADING" }
  | { type: "SIGNED_IN"; user: User; session: Session }
  | { type: "SIGNED_OUT" };

interface AuthContextValue {
  holdRedirect: boolean;
  setHoldRedirect: (hold: boolean) => void;
  signOut: () => Promise<void>;
  state: AuthState;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":
      return { status: "loading" };
    case "SIGNED_IN":
      return {
        status: "authenticated",
        session: action.session,
        user: action.user,
      };
    case "SIGNED_OUT":
      return { status: "unauthenticated" };
    default:
      return _state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "loading" });
  const [holdRedirect, setHoldRedirect] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error || !data.session?.user) {
        dispatch({ type: "SIGNED_OUT" });
        return;
      }

      dispatch({
        type: "SIGNED_IN",
        session: data.session,
        user: data.session.user,
      });
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch({ type: "SIGNED_IN", session, user: session.user });
        return;
      }

      dispatch({ type: "SIGNED_OUT" });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      holdRedirect,
      setHoldRedirect,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      state,
    }),
    [holdRedirect, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
