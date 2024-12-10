export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjU0NDgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2MWQwMEFENzYwNjhGOEQ0NzQwYzM1OEM4QzAzYUFFYjUxMGI1OTBEIn0",
      payload: "eyJkb21haW4iOiJmcmFtZXMtdjItZGVtby1saWFydC52ZXJjZWwuYXBwIn0",
      signature:
        "MHg4ODQ5M2EwNWQ0OTg2NjBiNzZjOTVkM2QzZGY3ZDY2OTZjZWIzZGU1YTA1NTdkZmJkZTk2YmNlOTNjMDcyOTM1NjNlMThjNWFiMThkOGQ4NGI3MzkxNmY0ZDdiZTU3NzVhMjNkNjExMmU3MWFhNjI0OTZjMDhiZGU5ZjBiMTlkYjFi",
    },
    frame: {
      version: "0.0.0",
      name: "Frames v2 Demo",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
