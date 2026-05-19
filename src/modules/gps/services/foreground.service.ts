import { registerPlugin } from "@capacitor/core";

interface ForegroundServicePlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
}

const ForegroundService =
  registerPlugin<ForegroundServicePlugin>(
    "ForegroundService"
  );

export async function startForegroundService() {

  try {

    await ForegroundService.start();

    console.log(
      "Foreground service iniciado"
    );

  } catch (error) {

    console.error(
      "Erro ao iniciar foreground service:",
      error
    );
  }
}

export async function stopForegroundService() {

  try {

    await ForegroundService.stop();

    console.log(
      "Foreground service parado"
    );

  } catch (error) {

    console.error(
      "Erro ao parar foreground service:",
      error
    );
  }
}