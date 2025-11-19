import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, MessageCircle, Heart, Zap, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatAlert {
  id: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'question' | 'topic_request' | 'concern' | 'appreciation' | 'other';
  summary: string;
  zeroAnalysis: string;
  actionSuggestion?: string;
}

interface ChatMonitorPanelProps {
  onAddressAlert: (text: string) => void;
}

export function ChatMonitorPanel({ onAddressAlert }: ChatMonitorPanelProps) {
  const { toast } = useToast();
  
  const { data: alertsData, refetch } = useQuery({
    queryKey: ["/api/zero/monitor/alerts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/zero/monitor/alerts?limit=20");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const alerts: ChatAlert[] = alertsData?.alerts || [];

  const handleDismiss = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/zero/monitor/alerts/${id}`);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const handleAddress = (alert: ChatAlert) => {
    // Format a response based on the alert
    const prefix = alert.category === 'question' ? "Great question from chat: " 
      : alert.category === 'appreciation' ? "Thank you so much: "
      : "Addressing this point: ";
      
    onAddressAlert(`${prefix}${alert.summary}`);
    handleDismiss(alert.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white animate-pulse';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'question': return <MessageCircle className="w-4 h-4" />;
      case 'appreciation': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'topic_request': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'concern': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col border-l rounded-none border-border bg-card/30">
      <CardHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Zero Chat Monitor
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {alerts.length} Alerts
        </Badge>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">All quiet in the chat.</p>
              <p className="text-xs mt-1">Zero is listening...</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-card border border-border rounded-lg p-3 shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`text-[10px] px-1.5 py-0.5 ${getPriorityColor(alert.priority)}`}>
                    {alert.priority.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDismiss(alert.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 items-start mb-2">
                  <div className="mt-0.5 bg-background p-1 rounded-md border border-border">
                    {getIcon(alert.category)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{alert.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.zeroAnalysis}</p>
                  </div>
                </div>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full mt-2 h-7 text-xs gap-1"
                  onClick={() => handleAddress(alert)}
                >
                  <Check className="w-3 h-3" />
                  Address Now
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
