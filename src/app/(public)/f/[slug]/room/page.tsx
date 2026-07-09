import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WebinarRoomClient } from "@/components/public/room-client";

export const dynamic = "force-dynamic";

export default async function WebinarRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
  });

  if (!form || !form.webinarEnabled) {
    return notFound();
  }

  return (
    <WebinarRoomClient
      form={JSON.parse(
        JSON.stringify({
          id: form.id,
          slug: form.slug,
          title: form.title,
          description: form.description,
          accentColor: form.accentColor,
          youtubeVideoId: form.youtubeVideoId,
          chatEnabled: form.chatEnabled,
        })
      )}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    select: { title: true },
  });
  const title = form ? (form.title as { en?: string; es?: string })?.en ?? "Live Room" : "Live Room";
  return { title: `${title} — Live Webinar Room` };
}
