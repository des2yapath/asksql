import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";

// The console pulls in recharts for the results chart view, which is the
// single biggest dependency in this app. Code-splitting it out means
// someone landing on "/" for the marketing page never pays for it - only
// people who actually open the console do.
const Console = lazy(() => import("./pages/Console"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/console"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center bg-canvas" />}>
            <Console />
          </Suspense>
        }
      />
    </Routes>
  );
}
