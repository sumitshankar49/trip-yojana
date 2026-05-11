"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/packages/lib/toast";
import {
  Plus,
  Users,
  Receipt,
  Wallet,
  HandCoins,
  Sparkles,
  Loader2,
  UserPlus,
  MoreVertical,
  PencilLine,
  Trash2,
} from "lucide-react";
import Navbar from "@/packages/components/shared/Navbar";
import ConfirmationModal from "@/packages/components/shared/ConfirmationModal";
import { TripFilter, type TripOption } from "@/packages/components/shared/TripFilter";
import { InputFieldControlled } from "@/packages/components/shared/form/InputFieldControlled";
import { Form } from "@/packages/components/ui/form";
import { Button } from "@/packages/components/ui/button";
import { Input } from "@/packages/components/ui/input";
import { Checkbox } from "@/packages/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/packages/components/ui/card";
import { Badge } from "@/packages/components/ui/badge";
import { Skeleton } from "@/packages/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/packages/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/packages/components/ui/select";
import { Avatar, AvatarFallback } from "@/packages/components/ui/avatar";

const createGroupSchema = z.object({
  name: z.string().min(2, "Group name is required").max(80),
  description: z.string().max(300).optional(),
  currency: z.string().length(3).optional(),
});

const inviteMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

const createExpenseSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(2, "Category is required").max(60),
  notes: z.string().max(500).optional(),
  paidByMemberId: z.string().min(1, "Select payer"),
  splitMethod: z.enum(["equal", "custom"]),
  participantIds: z.array(z.string().min(1)).min(1, "Select at least one participant"),
});

const settleSchema = z.object({
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

type CreateGroupValues = z.infer<typeof createGroupSchema>;
type InviteMemberValues = z.infer<typeof inviteMemberSchema>;
type CreateExpenseValues = z.infer<typeof createExpenseSchema>;
type SettleValues = z.infer<typeof settleSchema>;

type ApiTrip = {
  id?: string;
  _id?: string;
  title: string;
  source?: string;
  destination?: string;
};

type GroupMember = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
};

type GroupExpense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  notes?: string | null;
  paidAt: string;
  paidByMember: {
    id: string;
    name: string;
    email: string;
  };
  shares: Array<{
    id: string;
    amount: number;
    member: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

type GroupSummaryBalance = {
  memberId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  paid: number;
  share: number;
  settledIn: number;
  settledOut: number;
  balance: number;
};

type SettlementSuggestion = {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
};

type ExpenseGroup = {
  id: string;
  tripId: string;
  name: string;
  description?: string | null;
  currency: string;
  ownerId: string;
  memberCount: number;
  expenseCount: number;
  totalExpense: number;
};

type CurrencyOption = {
  code: string;
  name: string;
};

type PendingInvite = {
  id: string;
  groupId: string;
  email: string;
  role: string;
  group: {
    id: string;
    name: string;
    trip: {
      id: string;
      title: string;
      destination: string;
    };
  };
};

type GroupDetailsPayload = {
  viewer?: {
    userId: string;
    memberId: string | null;
  };
  group: {
    id: string;
    tripId: string;
    name: string;
    description?: string | null;
    currency: string;
    ownerId: string;
    members: GroupMember[];
    expenses: GroupExpense[];
  };
  summary: {
    totalExpense: number;
    balances: GroupSummaryBalance[];
    settlementSuggestions: SettlementSuggestion[];
  };
};

const normalizeCurrencyCode = (currency?: string) => {
  const code = (currency || "INR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "INR";
};

const formatCurrency = (amount: number, currency = "INR") => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = normalizeCurrencyCode(currency);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId") || "";
  const requestedInviteId = searchParams.get("inviteId") || "";

  const [trips, setTrips] = useState<TripOption[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDetails, setGroupDetails] = useState<GroupDetailsPayload | null>(null);

  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupDetails, setIsLoadingGroupDetails] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [processingInviteId, setProcessingInviteId] = useState("");

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([
    { code: "INR", name: "Indian Rupee" },
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
  ]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [isMemberEditOpen, setIsMemberEditOpen] = useState(false);
  const [isMemberSaving, setIsMemberSaving] = useState(false);
  const [memberPendingDelete, setMemberPendingDelete] = useState<GroupMember | null>(null);
  const [isMemberDeleting, setIsMemberDeleting] = useState(false);
  const [memberEditForm, setMemberEditForm] = useState({
    name: "",
    role: "member",
  });
  const [customSplitValues, setCustomSplitValues] = useState<Record<string, string>>({});

  const createGroupForm = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "INR",
    },
  });

  const inviteForm = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const expenseForm = useForm<CreateExpenseValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      category: "Food",
      notes: "",
      paidByMemberId: "",
      splitMethod: "equal",
      participantIds: [],
    },
  });

  const settleForm = useForm<SettleValues>({
    resolver: zodResolver(settleSchema),
    defaultValues: {
      fromMemberId: "",
      toMemberId: "",
      amount: 0,
    },
  });

  const activeGroups = useMemo(
    () => groups.filter((group) => group.tripId === selectedTripId),
    [groups, selectedTripId]
  );

  const members = useMemo(() => groupDetails?.group.members ?? [], [groupDetails]);
  const activeMembers = useMemo(
    () => members.filter((member) => member.status !== "declined" && member.status !== "removed"),
    [members]
  );

  const expenseTitleValue = expenseForm.watch("title");
  const expenseAmountValue = expenseForm.watch("amount");
  const expenseCategoryValue = expenseForm.watch("category");
  const expensePaidByMemberIdValue = expenseForm.watch("paidByMemberId");
  const expenseSplitMethodValue = expenseForm.watch("splitMethod");
  const expenseParticipantIdsValue = expenseForm.watch("participantIds");
  const customSplitTotal = useMemo(
    () =>
      (expenseParticipantIdsValue || []).reduce((sum, memberId) => {
        const raw = customSplitValues[memberId];
        const amount = Number(raw);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [customSplitValues, expenseParticipantIdsValue]
  );
  const isCustomSplitValid =
    expenseSplitMethodValue !== "custom" ||
    Math.abs(customSplitTotal - Number(expenseAmountValue || 0)) <= 0.01;
  const isExpenseFormReady =
    expenseTitleValue.trim().length > 0 &&
    Number(expenseAmountValue) > 0 &&
    expenseCategoryValue.trim().length > 0 &&
    expensePaidByMemberIdValue.trim().length > 0 &&
    (expenseParticipantIdsValue?.length || 0) > 0 &&
    isCustomSplitValid;

  const expenses = groupDetails?.group.expenses || [];
  const balances = groupDetails?.summary.balances || [];
  const suggestions = useMemo(
    () => groupDetails?.summary.settlementSuggestions ?? [],
    [groupDetails]
  );

  const settlementDetailsByMember = useMemo(() => {
    const map = new Map<
      string,
      {
        owes: Array<{ name: string; amount: number }>;
        gets: Array<{ name: string; amount: number }>;
      }
    >();

    suggestions.forEach((item) => {
      const fromEntry = map.get(item.fromMemberId) || { owes: [], gets: [] };
      fromEntry.owes.push({ name: item.toName, amount: item.amount });
      map.set(item.fromMemberId, fromEntry);

      const toEntry = map.get(item.toMemberId) || { owes: [], gets: [] };
      toEntry.gets.push({ name: item.fromName, amount: item.amount });
      map.set(item.toMemberId, toEntry);
    });

    return map;
  }, [suggestions]);

  const myMemberId = groupDetails?.viewer?.memberId || null;
  const myBalance = myMemberId ? balances.find((item) => item.memberId === myMemberId) || null : null;
  const mySettlementDetails = myMemberId ? settlementDetailsByMember.get(myMemberId) : undefined;

  useEffect(() => {
    const controller = new AbortController();

    const loadCurrencies = async () => {
      try {
        setIsLoadingCurrencies(true);
        const response = await fetch("https://open.er-api.com/v6/latest/USD", {
          cache: "force-cache",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { rates?: Record<string, number> };
        const rates = data.rates || {};

        const mapped = Object.keys(rates)
          .filter((code) => /^[A-Z]{3}$/.test(code))
          .map((code) => ({ code, name: code }))
          .sort((a, b) => a.code.localeCompare(b.code));

        if (mapped.length > 0) {
          setCurrencyOptions((previous) => {
            const merged = [...mapped, ...previous];
            return Array.from(new Map(merged.map((item) => [item.code, item])).values()).sort((a, b) =>
              a.code.localeCompare(b.code)
            );
          });
        }
      } catch {
        // Keep fallback currency list if public API is unavailable.
      } finally {
        setIsLoadingCurrencies(false);
      }
    };

    loadCurrencies();

    return () => controller.abort();
  }, []);

  const loadPendingInvites = useCallback(async () => {
    try {
      setIsLoadingInvites(true);
      const response = await fetch("/api/expense-groups/invitations", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setPendingInvites(data.invites || []);
    } catch (error) {
      console.error("Load pending invites error:", error);
    } finally {
      setIsLoadingInvites(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      setIsLoadingTrips(true);
      const response = await fetch("/api/trips", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to load trips");
        setTrips([]);
        return;
      }

      const mapped = (data.trips as ApiTrip[]).map((trip) => ({
        id: trip.id || trip._id || "",
        destination: trip.destination || trip.source || trip.title,
      }));

      setTrips(mapped);
      setSelectedTripId((previousTripId) => previousTripId || mapped[0]?.id || "");
    } catch (error) {
      console.error("Load trips error:", error);
      toast.error("Could not load trips");
    } finally {
      setIsLoadingTrips(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      const response = await fetch("/api/expense-groups", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to load groups");
        return;
      }
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Load groups error:", error);
      toast.error("Could not load collaborative groups");
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const loadGroupDetails = useCallback(async (groupId: string) => {
    if (!groupId) {
      setGroupDetails(null);
      return;
    }

    try {
      setIsLoadingGroupDetails(true);
      const response = await fetch(`/api/expense-groups/${groupId}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to load group details");
        setGroupDetails(null);
        return;
      }

      setGroupDetails(data);

      if (!expenseForm.getValues("paidByMemberId") && data.group.members.length > 0) {
        const firstActive = data.group.members.find(
          (member: GroupMember) => member.status !== "declined" && member.status !== "removed"
        );
        if (firstActive) {
          expenseForm.setValue("paidByMemberId", firstActive.id);
        }
      }

      const activeMemberIds = (data.group.members as GroupMember[])
        .filter((member) => member.status !== "declined" && member.status !== "removed")
        .map((member) => member.id);

      const existingParticipants = expenseForm.getValues("participantIds");
      if (!existingParticipants || existingParticipants.length === 0) {
        expenseForm.setValue("participantIds", activeMemberIds);
      }

      setCustomSplitValues((previous) => {
        const next: Record<string, string> = {};
        activeMemberIds.forEach((memberId) => {
          next[memberId] = previous[memberId] ?? "";
        });
        return next;
      });
    } catch (error) {
      console.error("Load group details error:", error);
      toast.error("Could not load selected group");
      setGroupDetails(null);
    } finally {
      setIsLoadingGroupDetails(false);
    }
  }, [expenseForm]);

  const handleOpenMemberEditor = (member: GroupMember) => {
    setEditingMember(member);
    setMemberEditForm({
      name: member.name,
      role: member.role === "admin" ? "admin" : "member",
    });
    setIsMemberEditOpen(true);
  };

  const handleMemberUpdate = async () => {
    if (!selectedGroupId || !editingMember) {
      return;
    }

    setIsMemberSaving(true);
    try {
      const response = await fetch(`/api/expense-groups/${selectedGroupId}/members/${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberEditForm.name.trim(),
          role: memberEditForm.role,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update member");
        return;
      }

      toast.success("Member updated successfully");
      setIsMemberEditOpen(false);
      setEditingMember(null);
      await loadGroupDetails(selectedGroupId);
    } catch (error) {
      console.error("Update member error:", error);
      toast.error("Failed to update member");
    } finally {
      setIsMemberSaving(false);
    }
  };

  const handleMemberDelete = async () => {
    if (!memberPendingDelete || !selectedGroupId) {
      return;
    }

    setIsMemberDeleting(true);
    try {
      const response = await fetch(`/api/expense-groups/${selectedGroupId}/members/${memberPendingDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to remove member");
        return;
      }

      toast.success(data.softRemoved ? "Member removed from active list" : "Member removed successfully");
      setMemberPendingDelete(null);
      await loadGroupDetails(selectedGroupId);
    } catch (error) {
      console.error("Delete member error:", error);
      toast.error("Failed to remove member");
    } finally {
      setIsMemberDeleting(false);
    }
  };

  useEffect(() => {
    loadTrips();
    loadGroups();
    loadPendingInvites();
  }, [loadTrips, loadGroups, loadPendingInvites]);

  useEffect(() => {
    if (!requestedInviteId || pendingInvites.length === 0) return;
    const matched = pendingInvites.find((invite) => invite.id === requestedInviteId);
    if (matched) {
      toast.info(`You have a pending invite for ${matched.group.name}.`);
    }
  }, [requestedInviteId, pendingInvites]);

  useEffect(() => {
    if (activeGroups.length === 0) {
      setSelectedGroupId("");
      setGroupDetails(null);
      return;
    }

    if (requestedGroupId && activeGroups.some((group) => group.id === requestedGroupId)) {
      setSelectedGroupId(requestedGroupId);
      return;
    }

    if (!selectedGroupId || !activeGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(activeGroups[0].id);
    }
  }, [requestedGroupId, selectedGroupId, activeGroups]);

  useEffect(() => {
    loadGroupDetails(selectedGroupId);
  }, [loadGroupDetails, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    const id = window.setInterval(() => {
      loadGroupDetails(selectedGroupId);
    }, 20000);

    return () => window.clearInterval(id);
  }, [loadGroupDetails, selectedGroupId]);

  const handleCreateGroup = createGroupForm.handleSubmit(async (values) => {
    if (!selectedTripId) {
      toast.error("Select a trip first");
      return;
    }

    try {
      const response = await fetch("/api/expense-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          name: values.name,
          description: values.description,
          currency: values.currency || "INR",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to create group");
        return;
      }

      toast.success("Group created successfully");
      setCreateGroupOpen(false);
      createGroupForm.reset();
      await loadGroups();
      setSelectedGroupId(data.group.id);
      router.replace(`/expenses?groupId=${data.group.id}`);
    } catch (error) {
      console.error("Create group error:", error);
      toast.error("Failed to create group");
    }
  });

  const handleInviteMember = inviteForm.handleSubmit(async (values) => {
    if (!selectedGroupId) {
      toast.error("Select a group first");
      return;
    }

    try {
      const response = await fetch(`/api/expense-groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: [values],
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to invite member");
        return;
      }

      toast.success("Member invited successfully");
      setInviteOpen(false);
      inviteForm.reset({ name: "", email: "" });
      await loadGroupDetails(selectedGroupId);
      await loadGroups();
    } catch (error) {
      console.error("Invite member error:", error);
      toast.error("Failed to invite member");
    }
  });

  const handleAddExpense = expenseForm.handleSubmit(async (values) => {
    if (!selectedGroupId) {
      toast.error("Select a group first");
      return;
    }

    const selectedParticipantIds = values.participantIds || [];
    const customShares =
      values.splitMethod === "custom"
        ? selectedParticipantIds.map((memberId) => ({
            memberId,
            amount: Number(customSplitValues[memberId] || 0),
          }))
        : undefined;

    try {
      const response = await fetch(`/api/expense-groups/${selectedGroupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          participantIds: selectedParticipantIds,
          shares: customShares,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to add expense");
        return;
      }

      toast.success("Expense added");
      setExpenseOpen(false);
      expenseForm.reset({
        title: "",
        amount: 0,
        category: "Food",
        notes: "",
        paidByMemberId: values.paidByMemberId,
        splitMethod: values.splitMethod,
        participantIds: values.participantIds,
      });
      await loadGroupDetails(selectedGroupId);
      await loadGroups();
    } catch (error) {
      console.error("Add expense error:", error);
      toast.error("Failed to add expense");
    }
  });

  const handleSettle = settleForm.handleSubmit(async (values) => {
    if (!selectedGroupId) {
      toast.error("Select a group first");
      return;
    }

    try {
      const response = await fetch(`/api/expense-groups/${selectedGroupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to settle");
        return;
      }

      toast.success("Settlement recorded");
      setSettleOpen(false);
      settleForm.reset({ fromMemberId: "", toMemberId: "", amount: 0 });
      await loadGroupDetails(selectedGroupId);
    } catch (error) {
      console.error("Settlement error:", error);
      toast.error("Failed to settle amount");
    }
  });

  const selectSuggestion = (item: SettlementSuggestion) => {
    settleForm.setValue("fromMemberId", item.fromMemberId);
    settleForm.setValue("toMemberId", item.toMemberId);
    settleForm.setValue("amount", item.amount);
    setSettleOpen(true);
  };

  const handleInviteAction = async (memberId: string, action: "accept" | "decline") => {
    try {
      setProcessingInviteId(memberId);
      const response = await fetch("/api/expense-groups/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update invite");
        return;
      }

      toast.success(action === "accept" ? "Invite accepted" : "Invite declined");
      await loadPendingInvites();
      await loadGroups();

      if (action === "accept" && data.groupId) {
        setSelectedGroupId(data.groupId);
        router.replace(`/expenses?groupId=${data.groupId}`);
      }
    } catch (error) {
      console.error("Invite action error:", error);
      toast.error("Could not update invite");
    } finally {
      setProcessingInviteId("");
    }
  };

  if (isLoadingTrips) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-105" />
            <Skeleton className="h-105 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-200/60 bg-linear-to-br from-cyan-100 via-sky-50 to-white p-6 dark:border-cyan-900/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl dark:bg-cyan-700/20" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-600/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Collaborative Expense Hub
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Trip Expenses
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Create groups, invite members, split expenses equally, and settle balances in one place.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <TripFilter
                selectedTripId={selectedTripId}
                onTripChange={(value) => {
                  setSelectedTripId(value);
                  setSelectedGroupId("");
                  setGroupDetails(null);
                }}
                trips={trips}
                isLoading={isLoadingTrips}
                className="w-full sm:w-72"
              />

              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="h-4 w-4" />
                    New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Expense Group</DialogTitle>
                    <DialogDescription>
                      Start a collaborative expense group for the selected trip.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createGroupForm}>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                      <InputFieldControlled
                        control={createGroupForm.control}
                        name="name"
                        label="Group Name"
                        placeholder="Ex: Goa Squad"
                        required
                      />
                      <InputFieldControlled
                        control={createGroupForm.control}
                        name="description"
                        label="Description"
                        placeholder="Optional short description"
                      />
                      <Controller
                        control={createGroupForm.control}
                        name="currency"
                        render={({ field }) => (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Currency</p>
                            <Select value={field.value || "INR"} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={isLoadingCurrencies ? "Loading currencies..." : "Select currency"}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.code} - {currency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateGroupOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createGroupForm.formState.isSubmitting}>
                          {createGroupForm.formState.isSubmitting ? "Creating..." : "Create Group"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {isLoadingInvites ? (
            <Card className="lg:col-span-3 border-amber-300/70 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="p-4 text-sm text-zinc-600 dark:text-zinc-300">Loading invites...</CardContent>
            </Card>
          ) : pendingInvites.length > 0 ? (
            <Card className="lg:col-span-3 border-amber-300/70 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Pending Expense Invites</CardTitle>
                <CardDescription>
                  Accept invites to join shared expense groups. These are also sent to your email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-zinc-900/60"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{invite.group.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Trip: {invite.group.trip.title} • {invite.group.trip.destination}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleInviteAction(invite.id, "decline")}
                        disabled={processingInviteId === invite.id}
                      >
                        Decline
                      </Button>
                      <Button
                        className="bg-cyan-600 text-white hover:bg-cyan-700"
                        onClick={() => handleInviteAction(invite.id, "accept")}
                        disabled={processingInviteId === invite.id}
                      >
                        {processingInviteId === invite.id ? "Please wait..." : "Accept Invite"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="lg:col-span-1 border-zinc-200/70 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-cyan-600" />
                Groups in Selected Trip
              </CardTitle>
              <CardDescription>
                Choose one active expense group to collaborate with members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingGroups ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : activeGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">No group created yet</p>
                  <p className="mt-1 text-sm text-zinc-500">Create your first group to invite members.</p>
                </div>
              ) : (
                activeGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      router.replace(`/expenses?groupId=${group.id}`);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selectedGroupId === group.id
                        ? "border-cyan-500 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-950/20"
                        : "border-zinc-200 hover:border-cyan-300 dark:border-zinc-800 dark:hover:border-cyan-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{group.name}</p>
                      <Badge variant="secondary">{group.currency}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{group.memberCount} members • {group.expenseCount} expenses</p>
                    <p className="mt-2 text-sm font-bold text-cyan-700 dark:text-cyan-300">
                      {formatCurrency(group.totalExpense, group.currency)}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Total Expense</p>
                  <p className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(groupDetails?.summary.totalExpense || 0, groupDetails?.group.currency || "INR")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Members</p>
                  <p className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{members.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Settlement Suggestions</p>
                  <p className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{suggestions.length}</p>
                </CardContent>
              </Card>
            </div>

            {isLoadingGroupDetails ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : !groupDetails ? (
              <Card>
                <CardContent className="p-10 text-center text-zinc-500">
                  Select a group to manage collaborative expenses.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{groupDetails.group.name}</CardTitle>
                      <CardDescription>{groupDetails.group.description || "Shared trip expenses and balances"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite Member</DialogTitle>
                            <DialogDescription>Add members by email and track pending invites.</DialogDescription>
                          </DialogHeader>
                          <Form {...inviteForm}>
                            <form onSubmit={handleInviteMember} className="space-y-4">
                              <InputFieldControlled
                                control={inviteForm.control}
                                name="name"
                                label="Name"
                                placeholder="Ex: Priya"
                                required
                              />
                              <InputFieldControlled
                                control={inviteForm.control}
                                name="email"
                                label="Email"
                                placeholder="Ex: priya@email.com"
                                required
                                type="email"
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={inviteForm.formState.isSubmitting}>
                                  {inviteForm.formState.isSubmitting ? "Inviting..." : "Send Invite"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
                        <DialogTrigger asChild>
                          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                            <Receipt className="h-4 w-4" />
                            Add Expense
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Expense</DialogTitle>
                            <DialogDescription>
                              Choose who paid, who participated, and split equally or set custom amounts.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...expenseForm}>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                              <InputFieldControlled
                                control={expenseForm.control}
                                name="title"
                                label="Expense Title"
                                placeholder="Ex: Beach resort"
                                required
                              />
                              <InputFieldControlled
                                control={expenseForm.control}
                                name="amount"
                                label="Amount"
                                placeholder="Ex: 5400"
                                type="number"
                                required
                                step="0.01"
                                min={0}
                              />
                              <InputFieldControlled
                                control={expenseForm.control}
                                name="category"
                                label="Category"
                                placeholder="Ex: Stay"
                                required
                              />
                              <InputFieldControlled
                                control={expenseForm.control}
                                name="notes"
                                label="Notes"
                                placeholder="Optional note"
                              />

                              <Controller
                                control={expenseForm.control}
                                name="paidByMemberId"
                                render={({ field }) => (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Paid By</p>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select payer" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {activeMembers.map((member) => (
                                          <SelectItem key={member.id} value={member.id}>
                                            {member.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              />

                              <Controller
                                control={expenseForm.control}
                                name="splitMethod"
                                render={({ field }) => (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Split Type</p>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select split type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="equal">Equal</SelectItem>
                                        <SelectItem value="custom">Custom Amounts</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              />

                              <Controller
                                control={expenseForm.control}
                                name="participantIds"
                                render={({ field }) => (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-medium">Split With</p>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => field.onChange(activeMembers.map((member) => member.id))}
                                      >
                                        Select all
                                      </Button>
                                    </div>
                                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border p-3">
                                      {activeMembers.map((member) => {
                                        const checked = (field.value || []).includes(member.id);
                                        return (
                                          <label key={member.id} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(value) => {
                                                  const current = field.value || [];
                                                  if (value) {
                                                    field.onChange(Array.from(new Set([...current, member.id])));
                                                    return;
                                                  }
                                                  field.onChange(current.filter((id: string) => id !== member.id));
                                                }}
                                              />
                                              <span className="text-sm font-medium">{member.name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                              {member.status}
                                            </Badge>
                                          </label>
                                        );
                                      })}
                                    </div>
                                    <p className="text-xs text-zinc-500">Only selected members will share this expense.</p>
                                  </div>
                                )}
                              />

                              {expenseSplitMethodValue === "custom" ? (
                                <div className="space-y-3 rounded-lg border p-3">
                                  <p className="text-sm font-medium">Custom Split Amounts</p>
                                  {(expenseParticipantIdsValue || []).length === 0 ? (
                                    <p className="text-xs text-zinc-500">Select participants first.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {(expenseParticipantIdsValue || []).map((memberId) => {
                                        const member = activeMembers.find((item) => item.id === memberId);
                                        if (!member) return null;

                                        return (
                                          <div key={memberId} className="grid grid-cols-[1fr_140px] items-center gap-3">
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{member.name}</p>
                                            <Input
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              placeholder="0.00"
                                              value={customSplitValues[memberId] || ""}
                                              onChange={(event) => {
                                                const value = event.target.value;
                                                setCustomSplitValues((previous) => ({
                                                  ...previous,
                                                  [memberId]: value,
                                                }));
                                              }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <p
                                    className={`text-xs ${
                                      isCustomSplitValid ? "text-zinc-500" : "text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    Split total: {formatCurrency(customSplitTotal, groupDetails.group.currency)} / Expense total: {formatCurrency(Number(expenseAmountValue) || 0, groupDetails.group.currency)}
                                  </p>
                                </div>
                              ) : null}

                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={
                                    expenseForm.formState.isSubmitting ||
                                    activeMembers.length === 0 ||
                                    !isExpenseFormReady
                                  }
                                >
                                  {expenseForm.formState.isSubmitting ? "Saving..." : "Save Expense"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
                              {initials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.name}</span>
                          <Badge variant={member.status === "accepted" ? "secondary" : "outline"}>
                            {member.status}
                          </Badge>
                          {member.role !== "member" ? <Badge>{member.role}</Badge> : null}
                          {member.role !== "owner" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs" className="h-6 w-6 rounded-full">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                  <span className="sr-only">Member actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleOpenMemberEditor(member)}>
                                  <PencilLine className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => setMemberPendingDelete(member)}>
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="border-zinc-200/70 dark:border-zinc-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-cyan-600" />
                            Member Balances
                          </CardTitle>
                          {myBalance ? (
                            <CardDescription>
                              Your balance: {myBalance.balance > 0.01
                                ? `You should receive ${formatCurrency(Math.abs(myBalance.balance), groupDetails.group.currency)}`
                                : myBalance.balance < -0.01
                                ? `You should pay ${formatCurrency(Math.abs(myBalance.balance), groupDetails.group.currency)}`
                                : "You are settled up"}
                            </CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {mySettlementDetails?.gets?.length ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                              You get money from {mySettlementDetails.gets
                                .map((entry) => `${entry.name} (${formatCurrency(entry.amount, groupDetails.group.currency)})`)
                                .join(", ")}
                            </div>
                          ) : null}
                          {mySettlementDetails?.owes?.length ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                              You owe money to {mySettlementDetails.owes
                                .map((entry) => `${entry.name} (${formatCurrency(entry.amount, groupDetails.group.currency)})`)
                                .join(", ")}
                            </div>
                          ) : null}
                          {balances.length === 0 ? (
                            <p className="text-sm text-zinc-500">No balances to show yet.</p>
                          ) : (
                            balances.map((item) => (
                              <div key={item.memberId} className="rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold">{item.name}</p>
                                  {item.balance > 0.01 ? (
                                    <p className="font-semibold text-emerald-600">
                                      gets {formatCurrency(Math.abs(item.balance), groupDetails.group.currency)}
                                    </p>
                                  ) : item.balance < -0.01 ? (
                                    <p className="font-semibold text-rose-600">
                                      owes {formatCurrency(Math.abs(item.balance), groupDetails.group.currency)}
                                    </p>
                                  ) : (
                                    <p className="font-semibold text-zinc-500">settled</p>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">
                                  Paid {formatCurrency(item.paid, groupDetails.group.currency)} • Share {formatCurrency(item.share, groupDetails.group.currency)}
                                </p>
                                {(() => {
                                  const detail = settlementDetailsByMember.get(item.memberId);

                                  if (!detail) {
                                    return (
                                      <p className="mt-1 text-xs text-zinc-400">No pending transfers.</p>
                                    );
                                  }

                                  if (detail.owes.length > 0) {
                                    return (
                                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                        Owes to {detail.owes.map((entry) => `${entry.name} (${formatCurrency(entry.amount, groupDetails.group.currency)})`).join(", ")}
                                      </p>
                                    );
                                  }

                                  if (detail.gets.length > 0) {
                                    return (
                                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                        Receives from {detail.gets.map((entry) => `${entry.name} (${formatCurrency(entry.amount, groupDetails.group.currency)})`).join(", ")}
                                      </p>
                                    );
                                  }

                                  return (
                                    <p className="mt-1 text-xs text-zinc-400">No pending transfers.</p>
                                  );
                                })()}
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-zinc-200/70 dark:border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <HandCoins className="h-5 w-5 text-cyan-600" />
                            Who Owes Whom
                          </CardTitle>
                          <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-2">
                                <Plus className="h-3.5 w-3.5" />
                                Settle Up
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Settlement</DialogTitle>
                                <DialogDescription>Mark a payment between members to update balances.</DialogDescription>
                              </DialogHeader>
                              <Form {...settleForm}>
                                <form onSubmit={handleSettle} className="space-y-4">
                                  <Controller
                                    control={settleForm.control}
                                    name="fromMemberId"
                                    render={({ field }) => (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">From</p>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select payer" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {activeMembers.map((member) => (
                                              <SelectItem key={member.id} value={member.id}>
                                                {member.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  />

                                  <Controller
                                    control={settleForm.control}
                                    name="toMemberId"
                                    render={({ field }) => (
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">To</p>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select receiver" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {activeMembers.map((member) => (
                                              <SelectItem key={member.id} value={member.id}>
                                                {member.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  />

                                  <InputFieldControlled
                                    control={settleForm.control}
                                    name="amount"
                                    label="Amount"
                                    placeholder="Ex: 1250"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    required
                                  />

                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setSettleOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button type="submit" disabled={settleForm.formState.isSubmitting}>
                                      {settleForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {suggestions.length === 0 ? (
                            <p className="text-sm text-zinc-500">No pending settlements. Group is balanced.</p>
                          ) : (
                            suggestions.map((item) => (
                              <button
                                key={`${item.fromMemberId}-${item.toMemberId}`}
                                type="button"
                                onClick={() => selectSuggestion(item)}
                                className="w-full rounded-lg border bg-zinc-50 p-3 text-left transition hover:border-cyan-300 dark:bg-zinc-900"
                              >
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                  <span className="font-semibold">{item.fromName}</span> owes <span className="font-semibold">{item.toName}</span>
                                </p>
                                <p className="mt-1 text-lg font-bold text-cyan-700 dark:text-cyan-300">
                                  {formatCurrency(item.amount, groupDetails.group.currency)}
                                </p>
                              </button>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-zinc-200/70 dark:border-zinc-800">
                      <CardHeader>
                        <CardTitle>Expenses Timeline</CardTitle>
                        <CardDescription>Beautiful, shared expense records with payer and participants.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expenses.length === 0 ? (
                          <div className="rounded-xl border border-dashed p-10 text-center">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-100">No expenses yet</p>
                            <p className="mt-1 text-sm text-zinc-500">Add your first shared expense to get started.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {expenses.map((expense) => (
                              <div
                                key={expense.id}
                                className="rounded-xl border bg-linear-to-r from-white to-cyan-50/50 p-4 dark:from-zinc-900 dark:to-zinc-900"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-base font-semibold">{expense.title}</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                      Paid by {expense.paidByMember.name} • {new Date(expense.paidAt).toLocaleDateString("en-IN")}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {expense.shares.map((share) => (
                                        <Badge key={share.id} variant="outline">
                                          {share.member.name}: {formatCurrency(share.amount, groupDetails.group.currency)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300">
                                      {formatCurrency(expense.amount, groupDetails.group.currency)}
                                    </p>
                                    <p className="text-xs uppercase text-zinc-500">{expense.category}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    <ConfirmationModal
      open={Boolean(memberPendingDelete)}
      onOpenChange={(open) => {
        if (!open) {
          setMemberPendingDelete(null);
        }
      }}
      title="Remove Group Member"
      description={memberPendingDelete
        ? `Remove ${memberPendingDelete.name} from this expense group? Their past expense records will be preserved where required.`
        : "Remove this member from the expense group."}
      confirmLabel="Remove Member"
      onConfirm={handleMemberDelete}
      isConfirming={isMemberDeleting}
    />

    <Dialog open={isMemberEditOpen} onOpenChange={setIsMemberEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>Update the member name or role.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
            <Input
              value={memberEditForm.name}
              onChange={(event) => setMemberEditForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Member name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
            <Select
              value={memberEditForm.role}
              onValueChange={(value) => setMemberEditForm((previous) => ({ ...previous, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingMember ? (
            <p className="text-xs text-zinc-500">Email: {editingMember.email}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsMemberEditOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleMemberUpdate} disabled={isMemberSaving} className="gap-2">
            {isMemberSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isMemberSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
}
