-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "username" TEXT,
    "farcasterFid" INTEGER,
    "fcastUsername" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 3,
    "lastCoinReset" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighScore" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "gameDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "HighScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_farcasterFid_key" ON "User"("farcasterFid");

-- AddForeignKey
ALTER TABLE "HighScore" ADD CONSTRAINT "HighScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
