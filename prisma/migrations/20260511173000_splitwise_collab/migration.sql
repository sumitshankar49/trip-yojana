-- CreateTable
CREATE TABLE "expense_groups" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_group_expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "paidByMemberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "splitMethod" TEXT NOT NULL DEFAULT 'equal',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_group_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_group_shares" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_group_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_transactions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "settledById" TEXT,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_groups_tripId_name_key" ON "expense_groups"("tripId", "name");

-- CreateIndex
CREATE INDEX "expense_groups_tripId_idx" ON "expense_groups"("tripId");

-- CreateIndex
CREATE INDEX "expense_groups_ownerId_idx" ON "expense_groups"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_group_members_groupId_email_key" ON "expense_group_members"("groupId", "email");

-- CreateIndex
CREATE INDEX "expense_group_members_groupId_idx" ON "expense_group_members"("groupId");

-- CreateIndex
CREATE INDEX "expense_group_members_userId_idx" ON "expense_group_members"("userId");

-- CreateIndex
CREATE INDEX "expense_group_expenses_groupId_idx" ON "expense_group_expenses"("groupId");

-- CreateIndex
CREATE INDEX "expense_group_expenses_paidByMemberId_idx" ON "expense_group_expenses"("paidByMemberId");

-- CreateIndex
CREATE INDEX "expense_group_expenses_createdById_idx" ON "expense_group_expenses"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "expense_group_shares_expenseId_memberId_key" ON "expense_group_shares"("expenseId", "memberId");

-- CreateIndex
CREATE INDEX "expense_group_shares_memberId_idx" ON "expense_group_shares"("memberId");

-- CreateIndex
CREATE INDEX "settlement_transactions_groupId_idx" ON "settlement_transactions"("groupId");

-- CreateIndex
CREATE INDEX "settlement_transactions_fromMemberId_idx" ON "settlement_transactions"("fromMemberId");

-- CreateIndex
CREATE INDEX "settlement_transactions_toMemberId_idx" ON "settlement_transactions"("toMemberId");

-- AddForeignKey
ALTER TABLE "expense_groups" ADD CONSTRAINT "expense_groups_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_groups" ADD CONSTRAINT "expense_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_members" ADD CONSTRAINT "expense_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "expense_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_members" ADD CONSTRAINT "expense_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_expenses" ADD CONSTRAINT "expense_group_expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "expense_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_expenses" ADD CONSTRAINT "expense_group_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_expenses" ADD CONSTRAINT "expense_group_expenses_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "expense_group_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_shares" ADD CONSTRAINT "expense_group_shares_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense_group_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_group_shares" ADD CONSTRAINT "expense_group_shares_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "expense_group_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_transactions" ADD CONSTRAINT "settlement_transactions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "expense_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_transactions" ADD CONSTRAINT "settlement_transactions_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "expense_group_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_transactions" ADD CONSTRAINT "settlement_transactions_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "expense_group_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_transactions" ADD CONSTRAINT "settlement_transactions_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
