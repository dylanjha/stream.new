-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "playbackId" VARCHAR(255),
    "assetId" VARCHAR(255),
    "uploadId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "muxAsset" JSONB,
    "disabledByModeration" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video.playbackId_unique" ON "Video"("playbackId");

-- CreateIndex
CREATE UNIQUE INDEX "Video.assetId_unique" ON "Video"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Video.uploadId_unique" ON "Video"("uploadId");
