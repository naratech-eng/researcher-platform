import { useMemo, useState } from "react";
import { Activity, Beaker, MessageSquare, MessageSquarePlus, Sparkles, User, Settings, Key, UserCog, LogOut, Pencil, Trash2, Check, X, MoreVertical } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/chatStore";

const navItems = [
  { title: "Emilia AI", url: "/", icon: MessageSquare },
  { title: "Research Environment", url: "/research", icon: Beaker },
  { title: "Behavior Analysis", url: "/behavior", icon: Activity },
];


export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open: sidebarOpen } = useSidebar();
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    currentConversationId,
    createConversation, 
    updateConversationTitle, 
    deleteConversation,
    clearSelection
  } = useChatStore();
  const items = useMemo(() => navItems, []);
  
  // State for conversation editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleNewChat = async () => {
    if (!user) {
      toast.error("Please sign in to create a new chat");
      return;
    }
    
    // Create new conversation and navigate to it
    const newConversationId = await createConversation(user.id);
    if (newConversationId) {
      navigate(`/?conversation=${newConversationId}`);
    }
  };
  
  const handleEditStart = (conversationId: string, currentTitle: string) => {
    setEditingId(conversationId);
    setEditingTitle(currentTitle);
  };

  const handleEditSave = async (conversationId: string) => {
    if (editingTitle.trim()) {
      await updateConversationTitle(conversationId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleDelete = async (conversationId: string) => {
    await deleteConversation(conversationId);
    // If viewing deleted conversation, navigate to home
    if (currentConversationId === conversationId) {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Failed to sign out. Please try again.");
      return;
    }
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "Research User";
  const displayEmail = user?.email ?? "user@agrh.com";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="flex h-full flex-col">
        {/* Logo Header */}
        <div className="border-b border-sidebar-border px-4 py-5">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "justify-start" : "justify-center"}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            {sidebarOpen && <h1 className="text-xl font-bold text-foreground">AGRH</h1>}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-2 pt-4">
          <Button
            className="w-full justify-center bg-primary font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            size={sidebarOpen ? "default" : "icon"}
            onClick={handleNewChat}
          >
            <MessageSquarePlus className={sidebarOpen ? "mr-2 h-4 w-4" : "h-5 w-5"} />
            {sidebarOpen && "New Chat"}
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-2">
          {sidebarOpen && <SidebarGroupLabel className="px-2">Main Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ title, url, icon: Icon }) => {
                // For Emilia AI ("/"), it's active when on "/" regardless of conversation param
                const isActive = url === "/" 
                  ? location.pathname === url
                  : location.pathname === url && !new URLSearchParams(location.search).get("conversation");
                
                return (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        // Clear conversation selection when navigating to home
                        if (url === "/") {
                          clearSelection();
                          navigate(url, { replace: true });
                        } else {
                          navigate(url);
                        }
                      }}
                      tooltip={title}
                    >
                      <Icon className="h-5 w-5" />
                      {sidebarOpen && <span>{title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History */}
        {conversations.length > 0 && (
          <SidebarGroup className="min-h-0 flex-1 px-2">
            {sidebarOpen && <SidebarGroupLabel className="px-2">Chat History</SidebarGroupLabel>}
            {sidebarOpen ? (
              <ScrollArea className="h-full flex-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {conversations.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        {editingId === chat.id ? (
                          <div className="flex items-center gap-2 px-2 py-2">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditSave(chat.id);
                                if (e.key === "Escape") handleEditCancel();
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleEditSave(chat.id)}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={handleEditCancel}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="group flex items-center gap-2">
                            <SidebarMenuButton
                              asChild
                              className="flex-1"
                              isActive={new URLSearchParams(location.search).get("conversation") === chat.id}
                            >
                              <div
                                className="flex cursor-pointer items-center rounded-lg px-4 py-2.5 transition-all"
                                onClick={() => navigate(`/?conversation=${chat.id}`)}
                              >
                                <span className="w-full max-w-[180px] truncate text-sm font-medium" title={chat.title}>
                                  {chat.title}
                                </span>
                              </div>
                            </SidebarMenuButton>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditStart(chat.id, chat.title)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit title
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(chat.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </ScrollArea>
            ) : null}
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer Profile */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Research User" 
              alt="Research User" 
            />
              <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{displayEmail}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-48">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Key className="mr-2 h-4 w-4" />
                    API Keys
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserCog className="mr-2 h-4 w-4" />
                    Switch Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
