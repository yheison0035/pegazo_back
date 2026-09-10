-- Adjunto opcional (imagen Cloudinary) en los mensajes de soporte.
ALTER TABLE "SupportMessage" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
