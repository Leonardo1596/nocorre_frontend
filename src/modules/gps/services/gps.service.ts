import {
  Geolocation,
  Position
} from "@capacitor/geolocation";

export async function requestGpsPermission() {
  const permission =
    await Geolocation.requestPermissions();

  return permission;
}

export async function getCurrentPosition() {
  const position =
    await Geolocation.getCurrentPosition({
      enableHighAccuracy: true
    });

  return position;
}

export async function startGpsTracking(
  callback: (position: Position) => void
) {
  const watchId =
    await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      },
      (position, err) => {
        if (err) {
          console.error(
            "GPS tracking error:",
            err
          );

          return;
        }

        if (position) {
          callback(position);
        }
      }
    );

  return watchId;
}

export async function stopGpsTracking(
  watchId: string
) {
  await Geolocation.clearWatch({
    id: watchId
  });
}