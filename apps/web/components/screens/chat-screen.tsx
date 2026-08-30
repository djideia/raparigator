"use client";

import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Flag,
  Image as ImageIcon,
  MoreHorizontal,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Shield,
  Star,
  Trash2,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useSetShellChrome } from "@/components/layout/shell-chrome";
import { Button } from "@/components/ui/button";
import { EncounterBriefCard, EncounterBriefPreview } from "@/components/ui/encounter-brief-card";
import { Modal } from "@/components/ui/modal";
import {
  PremiumConversionModal,
  type PremiumHighlight,
} from "@/components/ui/premium-conversion-modal";
import { Toast } from "@/components/ui/toast";
import { chromeCircle } from "@/lib/chrome-styles";
import { useModalLock } from "@/lib/modal-lock";
import {
  deleteChatConversationFromInbox,
  ensureChatStore,
  getChatStoreSnapshot,
  getServerChatStoreSnapshot,
  markConversationAsRead,
  reseedChatStore,
  reportChatConversation,
  sendChatBrief,
  sendChatText,
  sendChatViewOnceMedia,
  setChatConversationBlocked,
  subscribeChatStore,
  updateChatParticipantAlias,
} from "@/lib/chat-store";
import { getConversationAd } from "@/lib/conversation-ad";
import {
  buildBriefGreeting,
  clearBriefHandoff,
  getAdEditHref,
  getBriefHandoff,
  getServerBriefHandoff,
  subscribeBriefHandoff,
} from "@/lib/encounter-brief";
import {
  getInviteStatus,
  hasTwoWayConversation,
  sendReviewInvite,
  useReviewInvites,
  withdrawReviewInvite,
} from "@/lib/review-invites";
import type {
  AvailabilityStatus,
  Conversation,
  EncounterBrief,
  Message,
  ProfessionalAd,
} from "@/lib/types";
import { useAuthSession } from "@/lib/auth-session";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

const getStatusColor = (status: Conversation["contactStatus"]) =>
  status === "online" ? "bg-emerald-500" : "bg-zinc-400";
const getStatusLabel = (status: Conversation["contactStatus"]) =>
  status === "online" ? "Online" : "Offline";

const PROFESSIONAL_AVAILABILITY_STORAGE_KEY = "sigillus-professional-chat-availability";

const professionalAvailabilityOptions: {
  value: AvailabilityStatus;
  label: string;
  description: string;
  dotClass: string;
  activeClass: string;
}[] = [
  {
    value: "livre",
    label: "Disponível",
    description: "Seu status aparece disponível para novos contatos.",
    dotClass: "bg-emerald-500",
    activeClass: "ring-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    value: "em_atendimento",
    label: "Ocupado",
    description: "Seu status aparece como em atendimento.",
    dotClass: "bg-amber-500",
    activeClass: "ring-amber-200 bg-amber-50 text-amber-800",
  },
  {
    value: "indisponivel",
    label: "Indisponível",
    description: "Seu status aparece como indisponível.",
    dotClass: "bg-zinc-400",
    activeClass: "ring-zinc-300 bg-zinc-100 text-zinc-700",
  },
];

function readProfessionalAvailability(): AvailabilityStatus {
  if (typeof window === "undefined") {
    return "livre";
  }

  const stored = window.localStorage.getItem(PROFESSIONAL_AVAILABILITY_STORAGE_KEY);
  if (stored === "livre" || stored === "em_atendimento" || stored === "indisponivel") {
    return stored;
  }

  return "livre";
}

function saveProfessionalAvailability(status: AvailabilityStatus) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFESSIONAL_AVAILABILITY_STORAGE_KEY, status);
  }
}

function getProfessionalAvailabilityOption(status: AvailabilityStatus) {
  return (
    professionalAvailabilityOptions.find((item) => item.value === status) ??
    professionalAvailabilityOptions[0]
  );
}

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

function AvailabilityStatusSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: AvailabilityStatus;
  onClose: () => void;
  onSelect: (status: AvailabilityStatus) => void;
}) {
  useModalLock(open);
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const activeOption = getProfessionalAvailabilityOption(value);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="availability-sheet"
          className="fixed inset-0 z-220 flex items-end justify-center px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="availability-sheet-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            type="button"
            aria-label="Fechar disponibilidade"
            className="absolute inset-0 bg-zinc-900/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:rounded-3xl sm:p-5"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p id="availability-sheet-title" className="text-lg font-semibold text-zinc-900">
                  Disponibilidade
                </p>
                <p className="mt-1 text-sm leading-snug text-zinc-600">
                  {activeOption.description}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <fieldset className="grid grid-cols-1 gap-2">
              <legend className="sr-only">Disponibilidade</legend>
              {professionalAvailabilityOptions.map((option) => {
                const isActive = value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                      isActive
                        ? cn("border-transparent ring-1 shadow-sm", option.activeClass)
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white",
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", option.dotClass)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                        {option.description}
                      </span>
                    </span>
                    {isActive ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </fieldset>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

const getMessageStatus = (message: Message) => {
  if (message.from !== "me") return null;

  if (message.status === "sending")
    return { label: "Enviando", icon: Clock, className: "text-zinc-400" };
  if (message.status === "failed")
    return { label: "Falhou", icon: AlertCircle, className: "text-wine-600" };
  if (message.status === "delivered")
    return { label: "Entregue", icon: CheckCheck, className: "text-zinc-400" };
  return { label: "Enviada", icon: Check, className: "text-zinc-400" };
};

type ToastState = { title: string; message: string; type?: "success" | "error" | "info" } | null;

export function ChatScreen() {
  const { isLoggedIn, user, role } = useAuthSession();
  const { isPremium, canSendViewOnce } = usePremiumPlan();
  const { getInvite } = useReviewInvites();
  ensureChatStore();
  const snapshot = useSyncExternalStore(
    subscribeChatStore,
    getChatStoreSnapshot,
    getServerChatStoreSnapshot,
  );
  const localConversations = snapshot.conversations;
  const localMessages = snapshot.messages;
  const [activeConversationId, setActiveConversationId] = useState("");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const aliasFromUser = user?.alias ?? "Cliente reservado";
  const [globalAlias, setGlobalAlias] = useState(aliasFromUser);
  const [previousAliasFromUser, setPreviousAliasFromUser] = useState(aliasFromUser);
  const [globalAliasDraft, setGlobalAliasDraft] = useState(globalAlias);
  const [globalAliasModalOpen, setGlobalAliasModalOpen] = useState(false);
  const focusOnMount = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [professionalAvailability, setProfessionalAvailability] = useState<AvailabilityStatus>(() =>
    readProfessionalAvailability(),
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [availabilitySheetOpen, setAvailabilitySheetOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [viewOnceModalOpen, setViewOnceModalOpen] = useState(false);
  const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false);
  const [premiumUpsellHighlight, setPremiumUpsellHighlight] = useState<PremiumHighlight>("media");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const router = useRouter();
  const briefHandoff = useSyncExternalStore(
    subscribeBriefHandoff,
    getBriefHandoff,
    getServerBriefHandoff,
  );
  const [briefSending, setBriefSending] = useState(false);
  // O chat costuma montar já com um interesse pendente (o clique em "Chat Direto" cria
  // o handoff antes de navegar), então a saudação precisa nascer preenchida — não só ser
  // sincronizada depois, quando "anterior" e "atual" já seriam a mesma referência.
  const [briefGreeting, setBriefGreeting] = useState(() =>
    briefHandoff ? buildBriefGreeting(briefHandoff.brief) : "",
  );
  const [previousBriefHandoff, setPreviousBriefHandoff] = useState(briefHandoff);

  if (aliasFromUser !== previousAliasFromUser) {
    setPreviousAliasFromUser(aliasFromUser);
    setGlobalAlias(aliasFromUser);
  }

  // Sugestão de saudação repõe apenas quando um novo interesse chega (identidade do
  // handoff muda) — assim o texto editado pelo usuário sobrevive a re-renders.
  if (briefHandoff !== previousBriefHandoff) {
    setPreviousBriefHandoff(briefHandoff);
    if (briefHandoff) {
      setBriefGreeting(buildBriefGreeting(briefHandoff.brief));
    }
  }

  const visibleConversations = useMemo(
    () =>
      localConversations.filter(
        (conversation) =>
          !conversation.deletedFromInboxAt && (!unreadOnly || conversation.unread > 0),
      ),
    [localConversations, unreadOnly],
  );

  const fallbackConversationId = visibleConversations[0]?.id ?? "";
  const hasActiveConversation = visibleConversations.some(
    (conversation) => conversation.id === activeConversationId,
  );
  const resolvedActiveConversationId = hasActiveConversation
    ? activeConversationId
    : fallbackConversationId;

  if (resolvedActiveConversationId !== activeConversationId) {
    setActiveConversationId(resolvedActiveConversationId);
  }

  const activeAvailabilityOption = getProfessionalAvailabilityOption(professionalAvailability);

  const activeConversation =
    localConversations.find((conversation) => conversation.id === resolvedActiveConversationId) ??
    localConversations[0];
  const displayContactName = activeConversation?.contactName ?? "";
  const participantAlias = activeConversation?.currentUserAlias ?? "";
  const currentDisplayName = participantAlias || globalAlias || "Cliente reservado";

  const activeAd = useMemo(() => getConversationAd(activeConversation), [activeConversation]);

  const currentMessages = useMemo(
    () =>
      localMessages.filter(
        (message) => message.conversationId === activeConversation?.id && !message.deletedAt,
      ),
    [activeConversation?.id, localMessages],
  );

  const conversationAvatars = useMemo(() => {
    return Object.fromEntries(
      localConversations.map((conversation) => {
        const ad = getConversationAd(conversation);
        return [conversation.id, ad?.images[0] ?? null];
      }),
    );
  }, [localConversations]);

  const showToast = (payload: NonNullable<ToastState>) => {
    setToast(payload);
    window.setTimeout(() => setToast(null), 3600);
  };

  const reviewInviteControl = useMemo(() => {
    if (role !== "profissional" || !activeConversation || !activeAd) {
      return null;
    }

    const status = getInviteStatus(getInvite(activeConversation.id));

    if (status === "used") {
      return { label: "Perfil já avaliado por este contato", disabled: true, onClick: () => {} };
    }

    if (status === "open") {
      return {
        label: "Retirar convite de avaliação",
        disabled: false,
        onClick: () => {
          withdrawReviewInvite(activeConversation.id);
          showToast({
            type: "success",
            title: "Convite retirado",
            message: "Este contato não pode mais avaliar seu perfil.",
          });
        },
      };
    }

    if (activeConversation.isBlocked || !hasTwoWayConversation(currentMessages)) {
      return {
        label: "Convidar para avaliar",
        disabled: true,
        onClick: () => {},
      };
    }

    return {
      label: "Convidar para avaliar",
      disabled: false,
      onClick: () => {
        sendReviewInvite({
          conversationId: activeConversation.id,
          adSlug: activeAd.slug,
          professionalName: activeAd.artisticName,
        });
        showToast({
          type: "success",
          title: "Convite enviado",
          message: "O contato foi avisado e pode avaliar seu perfil.",
        });
      },
    };
  }, [activeAd, activeConversation, currentMessages, getInvite, role]);

  const loadChat = () => {
    try {
      reseedChatStore();
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível carregar suas conversas agora.");
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || !mobileConversationOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, [isMobileViewport, mobileConversationOpen]);

  // O briefing chega por um store, não pela URL: `TabsKeepAlive` mantém esta tela
  // montada entre as abas, então um efeito de montagem só rodaria na primeira visita.
  useEffect(() => {
    if (!briefHandoff) {
      return;
    }

    setActiveConversationId(briefHandoff.conversationId);
    setMobileConversationOpen(window.matchMedia("(max-width: 767px)").matches);
  }, [briefHandoff]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, mobileConversationOpen]);

  useEffect(() => {
    if (!lastSentMessageId) return;

    const timeout = window.setTimeout(() => setLastSentMessageId(null), 420);
    return () => window.clearTimeout(timeout);
  }, [lastSentMessageId]);

  const openConversation = (conversationId: string) => {
    markConversationAsRead(conversationId);
    setActiveConversationId(conversationId);
    setMobileConversationOpen(isMobileViewport);
    setProfilePanelOpen(false);
    setRenameModalOpen(false);
    setAttachmentMenuOpen(false);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeConversation || activeConversation.isBlocked) return;

    setDraft("");
    const result = await sendChatText(activeConversation.id, content, currentDisplayName);
    if (result.ok) {
      setLastSentMessageId(result.messageId);
      return;
    }
    if (result.messageId) {
      setLastSentMessageId(result.messageId);
    }
  };

  const handleSendBrief = async () => {
    const trimmedGreeting = briefGreeting.trim();
    if (
      !briefHandoff ||
      !activeConversation ||
      activeConversation.isBlocked ||
      briefSending ||
      !trimmedGreeting
    )
      return;

    const { brief } = briefHandoff;
    setBriefSending(true);
    const result = await sendChatBrief(
      activeConversation.id,
      brief,
      trimmedGreeting,
      currentDisplayName,
    );
    setBriefSending(false);

    if (result.messageId) {
      // A bolha já está no thread (confirmada ou marcada como falha), então a prévia sai
      // de cena para não permitir um segundo envio do mesmo interesse.
      setLastSentMessageId(result.messageId);
      clearBriefHandoff();
    }

    if (!result.ok) {
      showToast({
        type: "error",
        title: "Não deu para enviar",
        message:
          result.reason === "blocked"
            ? "Esta conversa está bloqueada."
            : "Tenta de novo em instantes.",
      });
    }
  };

  const handleEditBrief = () => {
    if (!briefHandoff) {
      return;
    }
    // Mantém o interesse pendente: se o usuário voltar sem mexer em nada, a prévia
    // continua aqui do jeito que estava. A âncora leva direto ao simulador, e não ao
    // topo do anúncio.
    router.push(getAdEditHref(briefHandoff.brief.adSlug));
  };

  const openPremiumUpsell = (highlight: PremiumHighlight) => {
    setPremiumUpsellHighlight(highlight);
    setPremiumUpsellOpen(true);
  };

  const handleOpenViewOnceModal = () => {
    if (!canSendViewOnce) {
      setAttachmentMenuOpen(false);
      openPremiumUpsell("media");
      return;
    }

    setViewOnceModalOpen(true);
  };

  const handleSendViewOnceMedia = async () => {
    if (!activeConversation || activeConversation.isBlocked) return;

    if (!canSendViewOnce) {
      setViewOnceModalOpen(false);
      openPremiumUpsell("media");
      return;
    }

    setViewOnceModalOpen(false);
    setAttachmentMenuOpen(false);

    const result = await sendChatViewOnceMedia(activeConversation.id, currentDisplayName);
    if (result.ok) {
      setLastSentMessageId(result.messageId);
      showToast({
        title: "Mídia temporária enviada",
        message: "Ela aparecerá como visualização única na conversa.",
        type: "success",
      });
      return;
    }
    if (result.messageId) {
      setLastSentMessageId(result.messageId);
    }
  };

  const openRenameModal = () => {
    if (!activeConversation) return;

    if (!isPremium) {
      setProfilePanelOpen(false);
      openPremiumUpsell("alias");
      return;
    }

    setRenameDraft(activeConversation.currentUserAlias ?? "");
    setRenameModalOpen(true);
    setProfilePanelOpen(false);
  };

  const openGlobalAliasModal = () => {
    setGlobalAliasDraft(globalAlias);
    setGlobalAliasModalOpen(true);
  };

  const saveParticipantAlias = async () => {
    if (!activeConversation) return;
    const sanitized = renameDraft.trim();
    setRenameModalOpen(false);
    const result = await updateChatParticipantAlias(activeConversation.id, sanitized || null);
    if (result.ok) {
      showToast({
        title: "Apelido atualizado",
        message: sanitized
          ? "Este apelido será usado nesta conversa."
          : "A conversa voltou a usar seu apelido geral.",
        type: "success",
      });
      return;
    }
    showToast({
      title: "Não foi possível salvar",
      message: "Tente novamente em instantes.",
      type: "error",
    });
  };

  const saveGlobalAlias = () => {
    const sanitized = globalAliasDraft.trim() || "Cliente reservado";
    setGlobalAlias(sanitized);
    setGlobalAliasDraft(sanitized);
    setGlobalAliasModalOpen(false);
    showToast({
      title: "Apelido geral atualizado",
      message: "Novas conversas usarão esse nome de exibição.",
      type: "success",
    });
  };

  const handleDeleteFromInbox = async () => {
    if (!activeConversation) return;

    const conversationId = activeConversation.id;
    setProfilePanelOpen(false);
    setDeleteModalOpen(false);
    setMobileConversationOpen(false);

    const result = await deleteChatConversationFromInbox(conversationId);
    if (result.ok) {
      showToast({
        title: "Conversa removida",
        message: "Ela saiu da sua caixa de entrada.",
        type: "success",
      });
      return;
    }
    showToast({
      title: "Não foi possível excluir",
      message: "Tente novamente em instantes.",
      type: "error",
    });
  };

  const handleBlockUser = async () => {
    if (!activeConversation) return;

    setProfilePanelOpen(false);
    setBlockModalOpen(false);

    const result = await setChatConversationBlocked(activeConversation.id, true);
    if (result.ok) {
      showToast({
        title: "Usuário bloqueado",
        message: "Novas mensagens ficam desativadas nesta conversa.",
        type: "success",
      });
      return;
    }
    showToast({
      title: "Não foi possível bloquear",
      message: "Tente novamente em instantes.",
      type: "error",
    });
  };

  const handleUnblockUser = async () => {
    if (!activeConversation) return;

    setProfilePanelOpen(false);
    setBlockModalOpen(false);

    const result = await setChatConversationBlocked(activeConversation.id, false);
    if (result.ok) {
      showToast({
        title: "Usuário desbloqueado",
        message: "O envio de mensagens foi reativado nesta conversa.",
        type: "success",
      });
      return;
    }
    showToast({
      title: "Não foi possível desbloquear",
      message: "Tente novamente em instantes.",
      type: "error",
    });
  };

  const handleReportConversation = async () => {
    if (!activeConversation) return;

    const reason = reportReason.trim();
    setReportModalOpen(false);
    setProfilePanelOpen(false);
    setReportReason("");

    const result = await reportChatConversation(activeConversation.id, reason);
    if (result.ok) {
      showToast({
        title: "Denúncia registrada",
        message: "A denúncia foi enviada para análise pela equipe.",
        type: "success",
      });
      return;
    }
    showToast({
      title: "Não foi possível denunciar",
      message: "Tente novamente em instantes.",
      type: "error",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Olá ${activeConversation?.contactName ?? ""}, vim pelo Sigillus.`)}`;
  const conversationOpenMobile =
    isLoggedIn && isMobileViewport && mobileConversationOpen && Boolean(activeConversation);

  const desktopNavRight = useMemo(
    () => (
      <div className="inline-flex items-center gap-3">
        {role === "profissional" ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/90 px-2.5 py-1 shadow-xs backdrop-blur-sm">
            {professionalAvailabilityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setProfessionalAvailability(option.value);
                  saveProfessionalAvailability(option.value);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  professionalAvailability === option.value
                    ? option.activeClass + " ring-1 ring-inset"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${option.dotClass}`} />
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 p-0.5 shadow-xs backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              !unreadOnly
                ? "bg-wine-700 text-white shadow-[0_2px_8px_rgba(182,0,49,0.28)]"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              unreadOnly
                ? "bg-wine-700 text-white shadow-[0_2px_8px_rgba(182,0,49,0.28)]"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Não lidas
          </button>
        </div>
      </div>
    ),
    [professionalAvailability, role, unreadOnly],
  );

  useSetShellChrome({
    hideMobileBottomNav: conversationOpenMobile,
    hideTopHeader: conversationOpenMobile,
    mainClassName: conversationOpenMobile ? "px-0 pb-0 pt-0 sm:px-0" : undefined,
    desktopNavRight: isLoggedIn ? desktopNavRight : undefined,
  });

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-120 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <div className="max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine-50 text-wine-700">
            <Shield size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Chat privado</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Entre na sua conta para acessar conversas, apelidos e recursos de segurança da
            plataforma.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/auth/login">
              <Button>Entrar</Button>
            </Link>
            <Link href="/auth/cadastro">
              <Button variant="secondary">Criar conta</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-240 w-[min(22rem,calc(100vw-2rem))] space-y-2">
        {toast ? <Toast title={toast.title} message={toast.message} type={toast.type} /> : null}
      </div>

      <div
        className={cn(
          "relative flex w-full min-h-0 flex-col overflow-hidden bg-zinc-50 md:grid md:grid-cols-[340px_minmax(0,1fr)] md:rounded-[28px] md:border md:border-zinc-200/80 md:bg-white md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
          "h-[calc(100dvh-9.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] md:min-h-128 md:h-[calc(100dvh-12.5rem)]",
          conversationOpenMobile && "max-md:hidden",
        )}
      >
        <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-50/80 md:shrink-0 md:border-r md:border-zinc-200">
          <div className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 py-1.5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-zinc-900">Conversas</h1>
                <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">
                  {`Você aparece como '${globalAlias}' para os outros`}
                </p>
              </div>
              <button
                type="button"
                onClick={openGlobalAliasModal}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-wine-700"
                aria-label="Alterar apelido geral"
              >
                <MessageSquareText size={18} />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white bg-wine-700 text-white shadow-sm transition-transform group-hover:scale-110">
                  <Pencil size={10} strokeWidth={2.5} />
                </div>
              </button>
            </div>
            {role === "profissional" ? (
              <button
                type="button"
                onClick={() => setAvailabilitySheetOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={availabilitySheetOpen}
                className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left transition hover:bg-zinc-100"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <p className="shrink-0 text-sm font-semibold text-zinc-800">Disponibilidade</p>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      activeAvailabilityOption.dotClass,
                    )}
                  />
                  <span className="truncate text-xs font-semibold text-zinc-600">
                    {activeAvailabilityOption.label}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
                    availabilitySheetOpen && "rotate-180",
                  )}
                />
              </button>
            ) : (
              <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-zinc-800">Aparecer online</p>
                  <p className="min-h-4 text-xs leading-4 text-zinc-500">
                    {presenceVisible ? "Seu status aparece online." : "Seu status aparece offline."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPresenceVisible((current) => !current)}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition",
                    presenceVisible ? "bg-emerald-500" : "bg-zinc-300",
                  )}
                  aria-pressed={presenceVisible}
                  aria-label="Alternar status online"
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                      presenceVisible ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loadError ? (
              <div className="flex min-h-full items-center justify-center p-6 text-center">
                <div>
                  <WifiOff className="mx-auto text-zinc-400" size={28} />
                  <p className="mt-3 text-sm font-semibold text-zinc-800">{loadError}</p>
                  <Button className="mt-4" variant="secondary" size="sm" onClick={loadChat}>
                    <RefreshCcw size={15} />
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : visibleConversations.length === 0 ? (
              <div className="flex min-h-full items-center justify-center p-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">Nenhuma conversa na caixa</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Quando uma conversa for iniciada, ela aparecerá aqui.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-1.5 p-2.5">
                {visibleConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      onClick={() => openConversation(conversation.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
                        activeConversationId === conversation.id
                          ? "border-wine-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-wine-500/10"
                          : "border-transparent bg-transparent hover:border-zinc-200 hover:bg-white/80 hover:shadow-sm",
                      )}
                    >
                      <div className="relative h-12 w-12 shrink-0">
                        <Image
                          src={conversationAvatars[conversation.id] || "/placeholder.png"}
                          alt={conversation.contactName}
                          fill
                          className="rounded-full border border-zinc-100 object-cover"
                          sizes="48px"
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white",
                            getStatusColor(conversation.contactStatus),
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-bold text-zinc-900 group-hover:text-wine-800">
                            {conversation.contactName}
                          </p>
                          <span className="text-[10px] font-medium text-zinc-400">
                            {conversation.lastMessageAt}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unread > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wine-700 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <AvailabilityStatusSheet
          open={availabilitySheetOpen}
          value={professionalAvailability}
          onClose={() => setAvailabilitySheetOpen(false)}
          onSelect={(status) => {
            setProfessionalAvailability(status);
            saveProfessionalAvailability(status);
            setAvailabilitySheetOpen(false);
          }}
        />

        <section className="relative hidden min-h-0 flex-1 flex-col overflow-hidden bg-zinc-100/50 overscroll-none md:flex">
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Selecione uma conversa</p>
                <p className="mt-1 text-xs text-zinc-500">As mensagens aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <ConversationThread
              activeConversation={activeConversation}
              activeConversationId={activeConversationId}
              activeAd={activeAd}
              attachmentMenuOpen={attachmentMenuOpen}
              conversationAvatar={conversationAvatars[activeConversationId] || "/placeholder.png"}
              currentMessages={currentMessages}
              displayContactName={displayContactName}
              draft={draft}
              globalAlias={globalAlias}
              lastSentMessageId={lastSentMessageId}
              participantAlias={participantAlias}
              profilePanelOpen={profilePanelOpen}
              reviewInviteControl={reviewInviteControl}
              scrollRef={scrollRef}
              showBackButton={false}
              whatsappUrl={whatsappUrl}
              onAttachmentMenuToggle={() => setAttachmentMenuOpen((current) => !current)}
              onBack={() => {
                setMobileConversationOpen(false);
                setProfilePanelOpen(false);
              }}
              onBlock={() => setBlockModalOpen(true)}
              onDelete={() => setDeleteModalOpen(true)}
              onDraftChange={setDraft}
              onOpenProfile={() => setProfilePanelOpen(true)}
              onOpenRename={openRenameModal}
              onOpenViewOnce={handleOpenViewOnceModal}
              onProfileClose={() => setProfilePanelOpen(false)}
              onReport={() => setReportModalOpen(true)}
              onSubmit={handleSubmit}
              pendingBrief={briefHandoff?.brief ?? null}
              briefSending={briefSending}
              briefGreeting={briefGreeting}
              onBriefGreetingChange={setBriefGreeting}
              onSendBrief={handleSendBrief}
              onDiscardBrief={clearBriefHandoff}
              onEditBrief={handleEditBrief}
            />
          )}
        </section>
      </div>

      {conversationOpenMobile && activeConversation && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-100 flex flex-col bg-zinc-100 overscroll-none md:hidden">
              <ConversationThread
                activeConversation={activeConversation}
                activeConversationId={activeConversationId}
                activeAd={activeAd}
                attachmentMenuOpen={attachmentMenuOpen}
                conversationAvatar={conversationAvatars[activeConversationId] || "/placeholder.png"}
                currentMessages={currentMessages}
                displayContactName={displayContactName}
                draft={draft}
                globalAlias={globalAlias}
                lastSentMessageId={lastSentMessageId}
                participantAlias={participantAlias}
                profilePanelOpen={profilePanelOpen}
                reviewInviteControl={reviewInviteControl}
                scrollRef={scrollRef}
                showBackButton
                whatsappUrl={whatsappUrl}
                onAttachmentMenuToggle={() => setAttachmentMenuOpen((current) => !current)}
                onBack={() => {
                  setMobileConversationOpen(false);
                  setProfilePanelOpen(false);
                }}
                onBlock={() => setBlockModalOpen(true)}
                onDelete={() => setDeleteModalOpen(true)}
                onDraftChange={setDraft}
                onOpenProfile={() => setProfilePanelOpen(true)}
                onOpenRename={openRenameModal}
                onOpenViewOnce={handleOpenViewOnceModal}
                onProfileClose={() => setProfilePanelOpen(false)}
                onReport={() => setReportModalOpen(true)}
                onSubmit={handleSubmit}
                pendingBrief={briefHandoff?.brief ?? null}
                briefSending={briefSending}
                briefGreeting={briefGreeting}
                onBriefGreetingChange={setBriefGreeting}
                onSendBrief={handleSendBrief}
                onDiscardBrief={clearBriefHandoff}
                onEditBrief={handleEditBrief}
              />
            </div>,
            document.body,
          )
        : null}

      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Seu apelido para essa conversa"
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setRenameModalOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={saveParticipantAlias}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="conversation-alias" className="text-sm font-semibold text-zinc-800">
            Apelido
          </label>
          <input
            id="conversation-alias"
            ref={focusOnMount}
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder="Ex: Cliente reservado"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
            maxLength={40}
          />
          <p className="text-xs text-zinc-500">Deixe vazio para usar seu apelido geral.</p>
        </div>
      </Modal>

      <Modal
        open={globalAliasModalOpen}
        onClose={() => setGlobalAliasModalOpen(false)}
        title="Apelido geral"
        description="Esse nome será usado quando uma conversa não tiver apelido próprio."
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setGlobalAliasModalOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={saveGlobalAlias}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="global-alias" className="text-sm font-semibold text-zinc-800">
            Apelido
          </label>
          <input
            id="global-alias"
            ref={focusOnMount}
            value={globalAliasDraft}
            onChange={(event) => setGlobalAliasDraft(event.target.value)}
            placeholder="Ex: Cliente reservado"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
            maxLength={40}
          />
        </div>
      </Modal>

      <Modal
        open={viewOnceModalOpen}
        onClose={() => setViewOnceModalOpen(false)}
        title="Mídia temporária"
        description="No backend real, o arquivo será enviado para storage privado e exibido uma única vez."
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setViewOnceModalOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleSendViewOnceMedia}>
              Simular envio
            </Button>
          </>
        }
      >
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-wine-700">
              <ImageIcon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Visualização única</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                A mídia aparece como aberta depois da primeira visualização e não deve ficar
                acessível novamente para o usuário.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <PremiumConversionModal
        open={premiumUpsellOpen}
        onClose={() => setPremiumUpsellOpen(false)}
        highlight={premiumUpsellHighlight}
        from={premiumUpsellHighlight}
      />

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir da minha caixa"
        description={`Remover a conversa com ${displayContactName} da sua lista?`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleDeleteFromInbox}>
              Excluir da minha caixa
            </Button>
          </>
        }
      >
        <p className="rounded-2xl bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-600">
          Essa ação remove a conversa da sua visualização no app. A política de retenção e auditoria
          fica a cargo do backend.
        </p>
      </Modal>

      <Modal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={activeConversation?.isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
        description={
          activeConversation?.isBlocked
            ? `Desbloquear ${displayContactName}?`
            : `Bloquear ${displayContactName}?`
        }
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={activeConversation?.isBlocked ? handleUnblockUser : handleBlockUser}
            >
              {activeConversation?.isBlocked ? "Desbloquear" : "Bloquear"}
            </Button>
          </>
        }
      >
        <p className="rounded-2xl bg-wine-50 p-3 text-sm leading-relaxed text-wine-800">
          {activeConversation?.isBlocked
            ? "O envio de mensagens será reativado nesta conversa."
            : "O envio de novas mensagens será desativado nesta conversa."}
        </p>
      </Modal>

      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Denunciar conversa"
        description={`Descreva o problema com ${displayContactName}.`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setReportModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleReportConversation}
              disabled={!reportReason.trim()}
            >
              Enviar denúncia
            </Button>
          </>
        }
      >
        <textarea
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          placeholder="Conte o que aconteceu..."
          className="min-h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
          maxLength={600}
        />
      </Modal>
    </>
  );
}

function ConversationThread({
  activeConversation,
  activeAd,
  attachmentMenuOpen,
  conversationAvatar,
  currentMessages,
  displayContactName,
  draft,
  globalAlias,
  lastSentMessageId,
  participantAlias,
  profilePanelOpen,
  reviewInviteControl,
  scrollRef,
  showBackButton,
  whatsappUrl,
  onAttachmentMenuToggle,
  onBack,
  onBlock,
  onDelete,
  onDraftChange,
  onOpenProfile,
  onOpenRename,
  onOpenViewOnce,
  onProfileClose,
  onReport,
  onSubmit,
  pendingBrief,
  briefSending,
  briefGreeting,
  onBriefGreetingChange,
  onSendBrief,
  onDiscardBrief,
  onEditBrief,
}: {
  activeConversation: Conversation;
  activeConversationId: string;
  activeAd: ProfessionalAd | null;
  attachmentMenuOpen: boolean;
  conversationAvatar: string;
  currentMessages: Message[];
  displayContactName: string;
  draft: string;
  globalAlias: string;
  lastSentMessageId: string | null;
  participantAlias: string;
  profilePanelOpen: boolean;
  reviewInviteControl: { label: string; disabled: boolean; onClick: () => void } | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  showBackButton: boolean;
  whatsappUrl: string;
  onAttachmentMenuToggle: () => void;
  onBack: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onDraftChange: (value: string) => void;
  onOpenProfile: () => void;
  onOpenRename: () => void;
  onOpenViewOnce: () => void;
  onProfileClose: () => void;
  onReport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pendingBrief: EncounterBrief | null;
  briefSending: boolean;
  briefGreeting: string;
  onBriefGreetingChange: (value: string) => void;
  onSendBrief: () => void;
  onDiscardBrief: () => void;
  onEditBrief: () => void;
}) {
  return (
    <>
      <header className="relative z-30 flex shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3 backdrop-blur-sm md:px-5 md:pt-4">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(chromeCircle, "text-zinc-600")}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        ) : null}

        <button
          type="button"
          className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
          onClick={onOpenProfile}
        >
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src={conversationAvatar}
              alt="Avatar"
              fill
              className="rounded-full border border-zinc-200/80 bg-white object-cover shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
              sizes="40px"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                getStatusColor(activeConversation.contactStatus),
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold leading-none text-zinc-900">{displayContactName}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {getStatusLabel(activeConversation.contactStatus)}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className={cn(chromeCircle, "text-zinc-500")}
          aria-label="Abrir opções do contato"
        >
          <MoreHorizontal size={18} />
        </button>
      </header>

      {activeConversation.isBlocked ? (
        <div className="shrink-0 border-b border-wine-100 bg-wine-50 px-4 py-3 text-sm font-medium text-wine-800">
          Usuário bloqueado. O envio de novas mensagens está desativado nesta conversa.
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "absolute inset-0 z-20 bg-zinc-900/30 px-3 transition-opacity duration-200 md:px-5",
            profilePanelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          role="presentation"
          onClick={onProfileClose}
        >
          <div
            className={cn(
              "mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl transition-all duration-250 ease-out md:ml-auto md:mr-4 md:mt-6 md:w-90",
              profilePanelOpen
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-4 scale-[0.98] opacity-0",
            )}
            role="presentation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-bold text-zinc-900">{displayContactName}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">
                Ações da conversa
              </p>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={onOpenRename}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <MessageSquareText size={16} />
                Alterar apelido para essa conversa
              </button>

              {activeAd ? (
                <Link
                  href={`/anuncio/${activeAd.slug}`}
                  onClick={onProfileClose}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Ver anúncio público
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-400"
                >
                  Ver anúncio público
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Ir para WhatsApp
              </a>

              {reviewInviteControl ? (
                <button
                  type="button"
                  disabled={reviewInviteControl.disabled}
                  onClick={reviewInviteControl.onClick}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
                >
                  <Star size={16} />
                  {reviewInviteControl.label}
                </button>
              ) : null}

              <button
                type="button"
                onClick={onBlock}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <Ban size={16} />
                {activeConversation.isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
              </button>

              <button
                type="button"
                onClick={onReport}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <Flag size={16} />
                Denunciar conversa
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-wine-700 transition hover:bg-wine-50"
              >
                <Trash2 size={16} />
                Excluir da minha caixa
              </button>
            </div>

            <div className="mt-2 border-t border-zinc-100 px-2 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Seu apelido para esse contato
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-700">
                {participantAlias || globalAlias}
              </p>
            </div>
          </div>
        </div>

        <div className="h-full space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(248,250,252,0.92)_38%,rgba(244,244,245,1)_100%)] p-4 md:p-6">
          {currentMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Nenhuma mensagem ainda</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Envie a primeira mensagem para iniciar a conversa.
                </p>
              </div>
            </div>
          ) : (
            currentMessages.map((message) => {
              const status = getMessageStatus(message);
              const StatusIcon = status?.icon;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[85%] flex-col md:max-w-[68%]",
                    message.from === "me" ? "ml-auto items-end" : "mr-auto items-start",
                    message.from === "me" && message.id === lastSentMessageId
                      ? "message-sent-pop"
                      : "",
                  )}
                >
                  {message.messageType === "brief" && message.brief ? (
                    <>
                      {message.content ? (
                        <div
                          className={cn(
                            "px-4 py-2.5 text-sm shadow-sm",
                            message.from === "me"
                              ? "rounded-2xl rounded-tr-sm bg-wine-700 text-white shadow-[0_10px_22px_rgba(182,0,49,0.18)]"
                              : "rounded-2xl rounded-tl-sm border border-zinc-200/60 bg-white text-zinc-800",
                          )}
                        >
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      ) : null}
                      <EncounterBriefCard brief={message.brief} className="mt-1.5" />
                    </>
                  ) : (
                    <div
                      className={cn(
                        "px-4 py-2.5 text-sm shadow-sm",
                        message.from === "me"
                          ? "rounded-2xl rounded-tr-sm bg-wine-700 text-white shadow-[0_10px_22px_rgba(182,0,49,0.18)]"
                          : "rounded-2xl rounded-tl-sm border border-zinc-200/60 bg-white text-zinc-800",
                      )}
                    >
                      {message.messageType === "media" ? (
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              message.from === "me" ? "bg-white/15" : "bg-zinc-100",
                            )}
                          >
                            <ImageIcon size={18} />
                          </span>
                          <div>
                            <p className="font-semibold">{message.media?.name ?? "Mídia"}</p>
                            <p
                              className={cn(
                                "text-xs",
                                message.from === "me" ? "text-white/75" : "text-zinc-500",
                              )}
                            >
                              {message.media?.openedAt ? "Aberta" : "Visualização única"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  )}
                  <span className="mt-1 flex items-center gap-1 px-1 text-[10px] font-medium uppercase text-zinc-400">
                    {message.sentAt}
                    {StatusIcon ? (
                      <>
                        <StatusIcon size={12} className={status.className} />
                        <span className={cn("normal-case", status.className)}>{status.label}</span>
                      </>
                    ) : null}
                  </span>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {pendingBrief && !activeConversation.isBlocked ? (
        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 pt-3">
          <EncounterBriefPreview
            brief={pendingBrief}
            greeting={briefGreeting}
            onGreetingChange={onBriefGreetingChange}
            sending={briefSending}
            onSend={onSendBrief}
            onDiscard={onDiscardBrief}
            onEdit={onEditBrief}
          />
        </div>
      ) : null}

      <form
        className={cn(
          "shrink-0 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
          pendingBrief && !activeConversation.isBlocked ? "" : "border-t border-zinc-200",
        )}
        onSubmit={onSubmit}
      >
        <div className="relative mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={onAttachmentMenuToggle}
            disabled={activeConversation.isBlocked}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Abrir anexos"
          >
            <Plus size={20} />
          </button>

          {attachmentMenuOpen ? (
            <div className="absolute bottom-14 left-0 z-30 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={onOpenViewOnce}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                <ImageIcon size={17} />
                Enviar mídia temporária
              </button>
            </div>
          ) : null}

          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={activeConversation.isBlocked ? "Usuário bloqueado" : "Mensagem..."}
            disabled={activeConversation.isBlocked}
            className="h-11 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-sm shadow-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            type="submit"
            className="h-11 rounded-full px-4 font-bold sm:px-6 gap-2"
            disabled={!draft.trim() || activeConversation.isBlocked}
          >
            <Send size={17} />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </form>
    </>
  );
}
