-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "ghInstallationId" INTEGER,
ALTER COLUMN "activated" DROP DEFAULT;
