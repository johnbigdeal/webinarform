"use client";

import { Card, Input, Label, Badge, Button } from "@/components/ui";
import type { Plan } from "@/generated/prisma/client";

type Props = {
  formId: string;
  slug: string;
  webinarEnabled: boolean;
  setWebinarEnabled: (v: boolean) => void;
  youtubeVideoId: string;
  setYoutubeVideoId: (v: string) => void;
  chatEnabled: boolean;
  setChatEnabled: (v: boolean) => void;
  userPlan: Plan;
};

export function WebinarSettingsEditor({
  slug,
  webinarEnabled,
  setWebinarEnabled,
  youtubeVideoId,
  setYoutubeVideoId,
  chatEnabled,
  setChatEnabled,
  userPlan,
}: Props) {
  const isPaid = userPlan === "PAID";
  const publicRoomUrl = `/f/${slug}/room`;

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Card */}
      <Card className="max-w-3xl p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Webinar Room Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure the live viewing room for your webinar attendees.
            </p>
          </div>
          <Badge className={webinarEnabled ? "bg-green-50 text-green-700 font-semibold" : "bg-gray-100 text-gray-500"}>
            {webinarEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {/* Toggle Webinar Room */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={webinarEnabled}
              onChange={(e) => setWebinarEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-950">Enable Live Webinar Room</span>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, users who submit this registration form can join the live room to watch the broadcast.
              </p>
            </div>
          </label>

          {/* YouTube Video ID Input */}
          <div className="flex flex-col gap-1.5 mt-2">
            <Label htmlFor="youtubeId">YouTube Live Video ID</Label>
            <Input
              id="youtubeId"
              type="text"
              placeholder="e.g. dQw4w9WgXcQ"
              value={youtubeVideoId}
              disabled={!webinarEnabled}
              onChange={(e) => setYoutubeVideoId(e.target.value.trim())}
              className="max-w-md font-mono"
            />
            <p className="text-xs text-gray-500">
              Enter the 11-character alphanumeric code from your YouTube Live URL (e.g. from `youtube.com/watch?v=VIDEO_ID`). Make sure embedding/inserción is enabled on your stream!
            </p>
          </div>

          {/* Toggle Live Chat */}
          <label className="flex items-start gap-3 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={chatEnabled}
              disabled={!webinarEnabled}
              onChange={(e) => setChatEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-950">Enable Live Chat</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Allows attendees to send messages and interact in real time during the webinar.
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* Live Room Access Card */}
      {webinarEnabled && (
        <Card className="max-w-3xl p-6 bg-blue-50/40 border border-blue-100">
          <h3 className="text-md font-semibold text-blue-900">Webinar Room Link</h3>
          <p className="text-sm text-blue-800 mt-1">
            Send this URL to your attendees or redirect them automatically. They will need to register first or enter their name to join the chat.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-950 select-all font-mono">
              {publicRoomUrl}
            </code>
            <a href={publicRoomUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary" className="bg-white">
                View Live Room →
              </Button>
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
