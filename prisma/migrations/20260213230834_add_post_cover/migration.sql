-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "coverAttachmentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_coverAttachmentId_fkey" FOREIGN KEY ("coverAttachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
