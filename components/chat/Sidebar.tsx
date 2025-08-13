"use client";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  Sparkles,
  HelpCircle,
  User,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useChats } from "@/lib/hooks/useChat";
import Link from "next/link";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import { Menu } from "lucide-react";

interface SidebarProps {
  currentChatId?: string;
}

/**
 * Sidebar Component
 * Main navigation sidebar with chat history, user profile, and settings
 * Supports responsive collapsible/expandable states and search functionality
 */
export default function Sidebar({ currentChatId }: SidebarProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, close, toggle, open } = useSidebar();
  
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats();

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );


  /**
   * Handles user sign out process
   * Redirects to sign in page after logout
   */
  const handleSignOut = async () => {
    await signOut(() => router.push("/signin"));
  };

  /**
   * Handles account deletion
   * For OAuth accounts, Clerk may show an additional browser confirm dialog
   */
  const handleDeleteAccount = async () => {
    if (!user) {
      setDeleteError("User not found");
      return;
    }

    // Don't proceed if already deleting
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");
    
    // Close our custom dialog first since Clerk will show its own for OAuth
    setShowDeleteDialog(false);

    try {
      // Note: For OAuth accounts, Clerk will show a browser confirm dialog
      // This is a security feature and cannot be bypassed
      await user.delete();
      
      // If we reach here, deletion was successful
      // Don't try to use signOut after deletion as the client is destroyed
      // Just do a hard redirect immediately
      window.location.href = "/signup";
      
    } catch (error: unknown) {
      console.error("Account deletion error:", error);
      
      // Only reopen dialog if the component is still mounted
      const errorObj = error as { message?: string; errors?: { code?: string; message?: string }[] };
      if (errorObj?.message !== 'Client has been destroyed') {
        // User likely cancelled the browser's confirm dialog or an error occurred
        // Reopen our dialog to show the error
        setShowDeleteDialog(true);
        
        // Check for specific error types
        if (errorObj?.errors?.[0]?.code === 'user_deletion_unsuccessful') {
          setDeleteError("Unable to delete account. Please try again or contact support.");
        } else if (errorObj?.errors?.[0]?.message) {
          setDeleteError(errorObj.errors[0].message);
        } else if (errorObj?.message === 'User denied the request') {
          // User cancelled the browser confirm dialog
          setDeleteError("");
        } else if (errorObj?.message) {
          setDeleteError(errorObj.message);
        } else {
          setDeleteError("Account deletion was cancelled or failed.");
        }
        
        setIsDeleting(false);
      } else {
        // Client destroyed means deletion succeeded, redirect
        window.location.href = "/signup";
      }
    }
  };

  /**
   * Manages delete dialog state and cleanup
   * @param open - Dialog open state
   */
  const handleDialogClose = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      // Reset state when dialog closes
      setDeleteError("");
    }
  };

  /**
   * Generates user initials for avatar display
   * Falls back to email or default if name not available
   */
  const getInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const email = user.primaryEmailAddress?.emailAddress || "";

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    } else if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  /**
   * Creates new chat and navigates to it
   */
  const handleNewChat = async () => {
    try {
      const newChat = await createChat();
      router.push(`/chat/${newChat._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  /**
   * Deletes a chat from history
   * @param chatId - ID of chat to delete
   * @param e - Mouse event to prevent propagation
   */
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Show user-friendly error message
      alert('Failed to delete chat. Please try again.');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}
      
      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed inset-y-0 left-0 z-50 ${isOpen ? 'w-72 lg:w-80' : 'md:w-16 w-72'} flex-col bg-sidebar text-sidebar-foreground overflow-hidden border-r border-sidebar-border/50 transition-all duration-300 ease-in-out md:relative ${isOpen ? 'flex' : 'flex'}`}>
      <div className={`${isOpen ? 'p-3' : 'p-2'} space-y-2`}>
        {/* Sidebar Toggle Button */}
        <Button
          onClick={toggle}
          variant="ghost"
          size="sm"
          className={`${isOpen ? 'w-auto justify-start' : 'w-full justify-center'} rounded-lg p-2 hover:bg-sidebar-accent/80 transition-colors h-11`}
          title="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className={`${isOpen ? 'w-full justify-start' : 'w-full justify-center'} rounded-lg hover:bg-sidebar-accent/80 transition-colors h-11 text-sm font-medium border border-sidebar-border/50 hover:border-sidebar-border`}
          title={isOpen ? undefined : "New chat"}
        >
          <Plus className={`${isOpen ? 'mr-3' : ''} h-4 w-4`} />
          {isOpen && "New chat"}
        </Button>
      </div>
      
      {isOpen ? (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-sidebar-accent/30 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50 h-9 rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
        </div>
      ) : (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            className="w-full justify-center rounded-lg hover:bg-sidebar-accent/80 transition-colors h-9"
            title="Search chats"
            onClick={() => open()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full sidebar-scroll">
          <nav className={`${isOpen ? 'px-3' : 'px-2'} py-2 space-y-1`}>
            {chatsLoading ? (
              isOpen ? (
                <div className="p-4 text-center text-sm text-sidebar-foreground/60">
                  <div className="animate-pulse">Loading chats...</div>
                </div>
              ) : null
            ) : filteredChats.length === 0 ? (
              isOpen ? (
                <div className="p-4 text-center text-sm text-sidebar-foreground/60">
                  <div className="space-y-2">
                    <div>{searchQuery ? 'No chats found' : 'No chats yet'}</div>
                    <div className="text-xs">
                      {searchQuery ? 'Try a different search term' : 'Start a new conversation above'}
                    </div>
                  </div>
                </div>
              ) : null
            ) : (
              filteredChats.slice(0, isOpen ? filteredChats.length : 5).map((chat) => (
                <div key={chat._id} className="group relative">
                  <Link href={`/chat/${chat._id}`} className="block">
                    <div
                      className={`w-full flex items-center ${isOpen ? 'px-3 pr-10' : 'px-2 justify-center'} rounded-lg h-10 transition-all cursor-pointer ${
                        currentChatId === chat._id 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border/50" 
                          : "hover:bg-sidebar-accent/60 text-sidebar-foreground/90 hover:text-sidebar-accent-foreground"
                      }`}
                      title={chat.title}
                    >
                      {isOpen ? (
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p 
                            className="text-sm font-medium"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block'
                            }}
                          >
                            {chat.title}
                          </p>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                      )}
                    </div>
                  </Link>
                  {isOpen && (
                    <button
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md p-1.5 hover:bg-destructive/10 text-sidebar-foreground/50 hover:text-destructive"
                      aria-label="Delete chat"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </nav>
        </ScrollArea>
      </div>

      {isOpen && <Separator />}

      {isOpen && (
        <div className="p-3">
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sidebar-foreground text-sm">Upgrade to Plus</span>
            </div>
            <p className="text-xs text-sidebar-foreground/70 mb-3 leading-relaxed">
              Get GPT-4, faster responses, and priority access to new features.
            </p>
            <Button
              size="sm"
              className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-8 text-xs"
            >
              Upgrade plan
            </Button>
          </div>
        </div>
      )}

      {isOpen && <Separator />}

      {/* User Profile Section */}
      <div className={`${isOpen ? 'p-3' : 'p-2'} border-t border-sidebar-border/50`}>
        {!isLoaded ? (
          isOpen ? (
            <div className="flex items-center gap-3 p-3">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-sidebar-accent rounded animate-pulse mb-1" />
                <div className="h-3 bg-sidebar-accent/50 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-2">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent animate-pulse" />
            </div>
          )
        ) : !user ? (
          isOpen ? (
            <div className="p-3 text-center">
              <p className="text-sm text-sidebar-foreground/60">Not signed in</p>
            </div>
          ) : (
            <div className="flex justify-center p-2">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent/50" />
            </div>
          )
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${isOpen ? 'justify-between' : 'justify-center'} rounded-lg ${isOpen ? 'p-3' : 'p-2'} hover:bg-sidebar-accent/80 transition-all group h-11`}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3' : ''}`}>
                  <Avatar className="h-8 w-8 ring-2 ring-sidebar-border/20">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || "User"}
                    />
                    <AvatarFallback className="bg-primary/80 text-primary-foreground font-semibold text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isOpen && (
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.fullName ||
                          user?.primaryEmailAddress?.emailAddress ||
                          "User"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60">Free Plan</p>
                    </div>
                  )}
                </div>
                {isOpen && <ChevronUp className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />}
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[260px]">
            <div className="p-2">
              <p className="text-sm font-medium">{user?.fullName || "User"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Plus
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={handleDialogClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• All your chat history</li>
                <li>• Your profile information</li>
                <li>• Any saved preferences</li>
              </ul>
              
              {user?.externalAccounts?.[0]?.provider && (
                <div className="p-3 bg-muted/50 rounded-lg mt-4">
                  <p className="text-sm text-muted-foreground">
                    Account linked with: <strong>{user.externalAccounts[0].provider}</strong>
                  </p>
                </div>
              )}

              {deleteError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    {deleteError}
                  </p>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault(); // Prevent default dialog close
                  handleDeleteAccount();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
    </>
  );
}
