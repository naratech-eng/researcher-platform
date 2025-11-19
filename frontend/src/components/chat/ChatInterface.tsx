import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Sparkles,
  StopCircle,
  Search,
  Brain,
  BarChart3,
  Loader2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Plot from "react-plotly.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { toast } from "sonner";
import { checkFastApiHealth, sendChatMessage, type ChatMessagePayload, type TableArtifact, type ChartArtifact, type Citation, type ChatResponsePayload } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore, type StoredMessage } from "@/store/chatStore";
import { uploadMessageAttachments } from "@/lib/fileUpload";

const suggestions = [
  {
    title: "Genetic Markers",
    prompt: "Analyze genetic markers for improved milk production in dairy cattle",
  },
  {
    title: "Breeding Strategy",
    prompt: "Suggest a breeding strategy to improve disease resistance in livestock",
  },
  {
    title: "Behavior Patterns",
    prompt: "Explain feeding behavior patterns in poultry and their genetic basis",
  },
  {
    title: "Data Analysis",
    prompt: "Help me interpret breeding value estimations from my genomic data",
  },
];

interface StreamingState {
  id: string;
  fullText: string;
  currentText: string;
  stage: "searching" | "analyzing" | "thinking";
}

export function ChatInterface() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    conversations,
    currentConversationId,
    messages,
    loadConversations,
    selectConversation,
    createConversation,
    appendMessage,
    loadingConversations,
    loadingMessages,
    resetChatState,
  } = useChatStore();
  const [input, setInput] = useState("");
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingArtifacts, setPendingArtifacts] = useState<ChatResponsePayload["artifacts"] | null>(null);
  const [pendingCitations, setPendingCitations] = useState<Citation[]>([]);
  
  // Feature flags
  const [includeCitations, setIncludeCitations] = useState(true);
  const [generateCharts, setGenerateCharts] = useState(false);
  const [deepSearch, setDeepSearch] = useState(false);

  const canSend = input.trim().length > 0 || attachedFiles.length > 0;
  const MAX_FILES = 5;

  useEffect(() => {
    if (!user) {
      resetChatState();
      return;
    }
    loadConversations(user.id);
  }, [user?.id, loadConversations, resetChatState]);

  useEffect(() => {
    if (!user || !conversations.length) return;

    const requestedConversation = searchParams.get("conversation");
    
    // Only select conversation if explicitly requested in URL
    if (requestedConversation && requestedConversation !== currentConversationId) {
      selectConversation(requestedConversation);
    }
  }, [user?.id, conversations, currentConversationId, selectConversation, searchParams]);

  useEffect(() => {
    if (!streamingState || !streamingState.fullText) return;

    const characters = Array.from(streamingState.fullText);
    let index = streamingState.currentText.length;
    const streamId = streamingState.id;
    const fullText = streamingState.fullText;
    const speedMultiplier = 3;
    const interval = setInterval(() => {
      index = Math.min(index + speedMultiplier, characters.length);
      const progress = characters.length ? index / characters.length : 1;
      const nextStage = progress < 0.33 ? "searching" : progress < 0.66 ? "analyzing" : "thinking";
      const nextText = characters.slice(0, index).join("");

      setStreamingState((prev) => (prev ? { ...prev, currentText: nextText, stage: nextStage } : prev));

      if (index >= characters.length) {
        clearInterval(interval);
        setStreamingState(null);
        const assistantMessage: StoredMessage = {
          id: streamId,
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
          artifacts: pendingArtifacts,
          citations: pendingCitations,
        };
        appendMessage(assistantMessage);
        setPendingArtifacts(null);
        setPendingCitations([]);
      }
    }, 7);

    return () => clearInterval(interval);
  }, [streamingState, appendMessage]);

  useEffect(() => {
    checkFastApiHealth().then(setBackendHealthy).catch(() => setBackendHealthy(false));
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.25);
    textareaRef.current.style.height = `${nextHeight}px`;
  }, [input]);

  const handleSuggestion = async (suggestion: string) => {
    if (!currentConversationId && user) {
      await createConversation(user.id);
    }
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, MAX_FILES - attachedFiles.length);
    
    if (attachedFiles.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    // Reset input to allow selecting the same file again
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const ensureConversation = async () => {
    if (currentConversationId) return currentConversationId;
    if (!user) {
      toast.error("Please sign in to start a conversation.");
      return null;
    }
    const newConversationId = await createConversation(user.id);
    if (newConversationId) {
      setSearchParams({ conversation: newConversationId }, { replace: true });
    }
    return newConversationId;
  };

  const handleSend = async () => {
    if (!canSend || streamingState) return;
    const conversationId = await ensureConversation();
    if (!conversationId) return;

    const trimmed = input.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    const messageId = crypto.randomUUID();
    let content = trimmed;
    if (attachedFiles.length > 0 && !trimmed) {
      content = `Uploaded ${attachedFiles.length} file(s): ${attachedFiles.map((f) => f.name).join(", ")}`;
    }

    const userMessage: StoredMessage = {
      id: messageId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    // Upload files in background if any
    if (attachedFiles.length > 0) {
      uploadMessageAttachments(attachedFiles, messageId)
        .then((uploaded) => {
          if (uploaded.length > 0) {
            toast.success(`Uploaded ${uploaded.length} file(s)`);
          }
        })
        .catch((error) => {
          console.error("File upload error:", error);
          toast.error("Failed to upload some files");
        });
    }

    appendMessage(userMessage);
    setInput("");
    setAttachedFiles([]);
    setAwaitingResponse(true);
    
    // Clear pending artifacts and citations from previous query
    setPendingArtifacts(null);
    setPendingCitations([]);

    const conversationPayload: ChatMessagePayload[] = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const pendingId = crypto.randomUUID();
    setStreamingState({ id: pendingId, fullText: "", currentText: "", stage: "searching" });

    sendChatMessage(conversationPayload)
      .then((response) => {
        setPendingArtifacts(response.artifacts);
        // Ensure citations is always an array, never undefined or null
        const citations = Array.isArray(response.citations) ? response.citations : [];
        setPendingCitations(citations);
        setAwaitingResponse(false);
        setStreamingState({
          id: pendingId,
          fullText: response.answer,
          currentText: "",
          stage: "searching",
        });
      })
      .catch((error: Error) => {
        toast.error(error.message || "Failed to contact backend");
        setStreamingState(null);
        setAwaitingResponse(false);
        // Clear pending state on error
        setPendingArtifacts(null);
        setPendingCitations([]);
      });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const stopStreaming = () => {
    setStreamingState(null);
  };

  const loadingIcon = useMemo(() => {
    if (!streamingState) return null;
    switch (streamingState.stage) {
      case "searching":
        return <Search className="h-4 w-4" />;
      case "analyzing":
        return <BarChart3 className="h-4 w-4" />;
      case "thinking":
      default:
        return <Brain className="h-4 w-4" />;
    }
  }, [streamingState]);

  const showWelcome = messages.length === 0 && !streamingState && !loadingMessages;

  return (
    <div className="flex h-full flex-col">
      {loadingConversations && (
        <div className="px-6 pt-4">
          <Card className="border border-border/40 bg-background/50 px-4 py-2 text-sm text-muted-foreground">
            Loading your chat history…
          </Card>
        </div>
      )}
      {messages.length > 0 && (
        <div className="flex justify-end px-6 pt-6">
          <Card className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Rich Markdown, Plotly, LaTeX, and Mermaid are supported.
          </Card>
        </div>
      )}

      {backendHealthy === false && (
        <div className="px-6">
          <Card className="border-destructive text-destructive bg-destructive/10 px-4 py-3 text-sm">
            FastAPI backend is unreachable. Responses will fail until the server is up.
          </Card>
        </div>
      )}

      {showWelcome ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 overflow-y-auto">
          <div className="space-y-6 text-center animate-fade-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to Emilia AI</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Ask about genomics, breeding strategies, behavior insights, and RAG-backed answers.
            </p>
          </div>
          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2 animate-fade-in">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.title}
                className="cursor-pointer border-2 p-4 transition-all hover:border-primary/50 hover:bg-accent/5"
                onClick={() => handleSuggestion(suggestion.prompt)}
              >
                <h4 className="mb-1 text-sm font-semibold">{suggestion.title}</h4>
                <p className="line-clamp-2 text-xs text-muted-foreground">{suggestion.prompt}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <Card
                  className={`${
                    message.role === "user"
                      ? "border border-border/40 bg-muted/60"
                      : "border border-border/30 bg-background/40"
                  } p-3 shadow-none`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  )}
                </Card>
                
                {/* Display artifacts for this specific message */}
                {(() => {
                  if (message.role !== "assistant" || !message.artifacts) return null;
                  
                  const artifacts = message.artifacts as any;
                  if (typeof artifacts !== 'object' || Array.isArray(artifacts)) return null;
                  
                  const hasTables = artifacts.tables?.length > 0;
                  const hasCharts = artifacts.charts?.length > 0;
                  
                  if (!hasTables && !hasCharts) return null;
                  
                  return (
                    <CollapsibleSection title="Query Results" defaultOpen={false}>
                      <div className="space-y-3">
                        {hasTables && artifacts.tables.map((table: TableArtifact) => {
                          const isNumberColumn = (col: string, idx: number) => {
                            // First column is a number column if it's "#", "No", "Rank", etc.
                            return idx === 0 && ['#', 'no', 'number', 'rank', 'row_number'].includes(col.toLowerCase());
                          };
                          
                          const shouldHighlightNumber = table.render_hints?.highlight_numbers ?? false;
                          
                          return (
                            <div key={table.id} className="rounded-lg border border-border/30 bg-muted/20 p-3 text-sm">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="font-medium text-muted-foreground">{table.title || "Table"}</div>
                                {table.render_hints?.is_aggregation && (
                                  <Badge variant="outline" className="text-xs">
                                    Aggregated Data
                                  </Badge>
                                )}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-border/40">
                                      {table.columns.map((col: string, colIdx: number) => (
                                        <th 
                                          key={colIdx} 
                                          className={`px-2 py-1.5 text-left font-medium ${
                                            isNumberColumn(col, colIdx) 
                                              ? 'w-12 text-center text-primary' 
                                              : ''
                                          }`}
                                        >
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.map((row: any[], rowIdx: number) => (
                                      <tr key={rowIdx} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                                        {row.map((cell: any, cellIdx: number) => (
                                          <td 
                                            key={cellIdx} 
                                            className={`px-2 py-1.5 ${
                                              isNumberColumn(table.columns[cellIdx], cellIdx)
                                                ? 'text-center font-semibold text-primary'
                                                : shouldHighlightNumber && typeof cell === 'number'
                                                ? 'font-mono font-medium'
                                                : ''
                                            }`}
                                          >
                                            {String(cell)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {table.render_hints?.show_totals && table.rows.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Total rows: {table.rows.length}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {hasCharts && artifacts.charts.map((chart: ChartArtifact) => (
                          chart.figure && (
                            <div key={chart.id} className="rounded-lg border border-border/30 bg-muted/20 p-3">
                              <div className="mb-2 text-sm font-medium text-muted-foreground">{chart.title || "Chart"}</div>
                              <Plot
                                data={chart.figure.data as any}
                                layout={{
                                  ...(chart.figure.layout as any),
                                  autosize: true,
                                  margin: { l: 40, r: 20, t: 30, b: 40 },
                                }}
                                config={{ responsive: true, displayModeBar: false }}
                                className="w-full"
                              />
                            </div>
                          )
                        ))}
                      </div>
                    </CollapsibleSection>
                  );
                })()}
                
                {/* Display citations for this specific message */}
                {/* Note: Citations are now intelligently filtered by the backend.
                    They only appear for research queries, not database queries. */}
                {(() => {
                  if (message.role !== "assistant" || !message.citations) return null;
                  
                  const citations = message.citations as any;
                  if (!Array.isArray(citations) || citations.length === 0) return null;
                  
                  // Additional validation: Ensure citations have actual content
                  // Filter out empty or invalid citation objects
                  const validCitations = citations.filter((c: Citation) => 
                    c && 
                    (c.title || c.source || c.url) && 
                    c.source !== undefined
                  );
                  
                  if (validCitations.length === 0) return null;
                  
                  return (
                    <CollapsibleSection 
                      title={`Citations (${validCitations.length})`} 
                      defaultOpen={true}
                    >
                      <div className="space-y-2">
                        {validCitations.map((citation: Citation, idx: number) => {
                          // Handle url which can be string or array of url objects
                          let urlToDisplay = '';
                          let urlHref = '';
                          
                          if (citation.url) {
                            if (typeof citation.url === 'string') {
                              // Simple string URL (arXiv, PubMed)
                              urlToDisplay = citation.url;
                              urlHref = citation.url;
                            } else if (Array.isArray(citation.url)) {
                              // Array of URL objects (Nature) - prefer first PDF, then HTML, then any
                              const pdfUrl = citation.url.find((u: any) => u.format === 'pdf');
                              const htmlUrl = citation.url.find((u: any) => u.format === 'html');
                              const anyUrl = citation.url.find((u: any) => u.value);
                              
                              const selectedUrl = pdfUrl || htmlUrl || anyUrl;
                              if (selectedUrl) {
                                urlToDisplay = selectedUrl.format 
                                  ? `View ${selectedUrl.format.toUpperCase()}` 
                                  : 'View Article';
                                urlHref = selectedUrl.value;
                              }
                            }
                          }
                          
                          // Use a combination of index and citation properties for unique key
                          const citationKey = citation.id || citation.title || `citation-${idx}`;
                          
                          return (
                            <div key={citationKey} className="rounded-lg border border-border/30 bg-muted/20 p-3 text-xs">
                              <div className="mb-1 font-medium">{String(citation.title || 'Untitled')}</div>
                              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {citation.authors && <span>{String(citation.authors)}</span>}
                                {citation.authors && citation.source && <span>•</span>}
                                {citation.source && (
                                  <span>
                                    {String(citation.source)}
                                    {citation.published && ` • ${String(citation.published).split('T')[0]}`}
                                  </span>
                                )}
                              </div>
                              {urlHref && (
                                <a
                                  href={urlHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {urlToDisplay}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleSection>
                  );
                })()}
              </div>
            ))}

            {(streamingState || awaitingResponse) && (
              <Card className="border border-border/40 bg-background/40 p-3 text-sm">
                {streamingState?.fullText ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MarkdownRenderer content={streamingState.currentText || "…"} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Contacting research backend…</span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="text-primary">
                    {loadingIcon}
                  </div>
                  <span className="capitalize">
                    {streamingState?.stage === "analyzing" && "Analyzing context"}
                    {streamingState?.stage === "thinking" && "Generating answer"}
                    {streamingState?.stage === "searching" && "Searching knowledge base"}
                    {!streamingState?.stage && "Awaiting response"}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl space-y-3 px-6 pb-6">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <Badge key={`${file.name}-${index}`} variant="secondary" className="gap-2 pr-1">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                <span className="max-w-[150px] truncate text-xs">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <Card className="border-2 p-4 transition-colors hover:border-primary/50">
          <div className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Emilia anything about animal genetics research…"
              className="min-h-[60px] max-h-[25vh] resize-none border-0 shadow-none focus-visible:ring-0"
              rows={1}
              disabled={!!streamingState}
            />

            {awaitingResponse || streamingState ? (
              <Button
                onClick={stopStreaming}
                size="icon"
                className="h-10 w-10 shrink-0"
                variant="destructive"
                title="Stop response"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={!canSend}
                title="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerFileInput}
                disabled={!!streamingState || attachedFiles.length >= MAX_FILES}
                className="h-8 gap-2"
              >
                <Paperclip className="h-4 w-4" />
                {attachedFiles.length > 0 ? `${attachedFiles.length}/${MAX_FILES} files` : "Attach files"}
              </Button>
              <span className="opacity-50">•</span>
              <span className="opacity-70">Images, PDFs (max {MAX_FILES})</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id="citations" 
                  checked={includeCitations}
                  onCheckedChange={(checked) => setIncludeCitations(!!checked)}
                  disabled={!!streamingState}
                />
                <Label htmlFor="citations" className="text-xs cursor-pointer">
                  Citations
                </Label>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id="charts" 
                  checked={generateCharts}
                  onCheckedChange={(checked) => setGenerateCharts(!!checked)}
                  disabled={!!streamingState}
                />
                <Label htmlFor="charts" className="text-xs cursor-pointer">
                  Charts
                </Label>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id="deep-search" 
                  checked={deepSearch}
                  onCheckedChange={(checked) => setDeepSearch(!!checked)}
                  disabled={!!streamingState}
                />
                <Label htmlFor="deep-search" className="text-xs cursor-pointer">
                  Deep Search
                </Label>
              </div>
            </div>
          </div>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/40 bg-background/60">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span className="text-xs uppercase tracking-wide">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t border-border/30 px-4 py-3 text-sm text-foreground/80">{children}</div>}
    </div>
  );
}
