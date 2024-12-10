import { eventPayloadSchema } from "@farcaster/frame-sdk";
import { NextRequest } from "next/server";
import { verifyJsonFarcasterSignature } from "~/lib/jfs";
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
} from "~/lib/kv";
import { sendFrameNotification } from "~/lib/notifs";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    const verifySignatureResult = await verifyJsonFarcasterSignature(
      requestJson
    );
    if (verifySignatureResult.success === false) {
      return Response.json(
        { success: false, error: verifySignatureResult.error },
        { status: 401 }
      );
    }

    data = verifySignatureResult;
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }

  const fid = data.fid;
  const payloadData = JSON.parse(
    Buffer.from(data.payload, "base64url").toString("utf-8")
  );
  const payload = eventPayloadSchema.safeParse(payloadData);

  if (payload.success === false) {
    return Response.json(
      { success: false, errors: payload.error.errors },
      { status: 400 }
    );
  }

  switch (payload.data.event) {
    case "frame_added":
      console.log(
        payload.data.notificationDetails
          ? `Got frame-added event for fid ${fid} with notification token ${payload.data.notificationDetails.token} and url ${payload.data.notificationDetails.url}`
          : `Got frame-added event for fid ${fid} with no notification details`
      );

      if (payload.data.notificationDetails) {
        await setUserNotificationDetails(fid, payload.data.notificationDetails);
        await sendFrameNotification({
          fid,
          title: "Welcome to Frames v2",
          body: "Frame is now added to your client",
        });
      } else {
        await deleteUserNotificationDetails(fid);
      }

      break;
    case "frame_removed":
      console.log(`Got frame-removed event for fid ${fid}`);

      await deleteUserNotificationDetails(fid);

      break;
    case "notifications_enabled":
      console.log(
        `Got notifications-enabled event for fid ${fid} with token ${
          payload.data.notificationDetails.token
        } and url ${payload.data.notificationDetails.url} ${JSON.stringify(
          payload.data
        )}`
      );

      await setUserNotificationDetails(fid, payload.data.notificationDetails);
      await sendFrameNotification({
        fid,
        title: "Ding ding ding",
        body: "Notifications are now enabled",
      });

      break;
    case "notifications_disabled":
      console.log(`Got notifications-disabled event for fid ${fid}`);

      await deleteUserNotificationDetails(fid);

      break;
  }

  return Response.json({ success: true });
}
