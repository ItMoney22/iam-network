import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Studio from "@/pages/studio";
import StudioLive from "@/pages/studio-live";
import ControlPanel from "@/pages/control-panel";
import ZeroChatPage from "@/pages/zero-chat";
import BrowserSourceChat from "@/pages/browser-source-chat";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/studio" component={Studio} />
      <Route path="/studio-live" component={StudioLive} />
      <Route path="/control" component={ControlPanel} />
      <Route path="/zero" component={ZeroChatPage} />
      <Route path="/browser-source/chat" component={BrowserSourceChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
