export type CameraFacingMode = 'user' | 'environment';

export type CameraSourceMode = 'hardware' | 'studio';

export type CameraErrorKind =
  | 'permission_denied'
  | 'no_device'
  | 'in_use'
  | 'overconstrained'
  | 'unsupported'
  | 'unknown';

export interface CameraErrorDiagnosis {
  kind: CameraErrorKind;
  title: string;
  message: string;
  browserHint: string;
  canRetryPopup: boolean;
}

export interface StudioPoseDefinition {
  id: string;
  label: string;
  shortLabel: string;
  caption: string;
}

export const STUDIO_POSES: StudioPoseDefinition[] = [
  {
    id: 'pose-1',
    label: 'Pose 01 · Editorial Portrait',
    shortLabel: 'Pose 01',
    caption: 'Classic 35mm head-and-shoulders framing'
  },
  {
    id: 'pose-2',
    label: 'Pose 02 · Candid Motion',
    shortLabel: 'Pose 02',
    caption: 'Warm tungsten studio candid'
  },
  {
    id: 'pose-3',
    label: 'Pose 03 · Archive Close-Up',
    shortLabel: 'Pose 03',
    caption: 'Intimate booth frame'
  }
];

/**
 * Returns the next studio pose index in a circular sequence so multi-shot bursts
 * produce varied frames automatically when using the live studio camera.
 */
export function getNextStudioPoseIndex(currentIndex: number, totalPoses: number = STUDIO_POSES.length): number {
  if (totalPoses <= 0) return 0;
  return ((currentIndex % totalPoses) + totalPoses + 1) % totalPoses;
}

/**
 * Returns an ordered list of MediaStreamConstraints to try when requesting camera access.
 * Supports an optional specific deviceId, then starts with HD ideal resolution + preferred facingMode,
 * falls back to basic facingMode, and finally generic `{ video: true }`.
 */
export function getCameraConstraintFallbacks(
  facingMode: CameraFacingMode,
  preferredDeviceId?: string
): MediaStreamConstraints[] {
  const constraintsList: MediaStreamConstraints[] = [];

  if (preferredDeviceId && preferredDeviceId.trim().length > 0) {
    constraintsList.push({
      video: {
        deviceId: { exact: preferredDeviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  }

  constraintsList.push(
    {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    },
    {
      video: {
        facingMode
      },
      audio: false
    },
    {
      video: true,
      audio: false
    }
  );

  return constraintsList;
}

/**
 * Attempts to acquire a camera MediaStream by trying constraint profiles in order.
 */
export async function requestCameraStreamWithFallback(
  getUserMediaFn: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  facingMode: CameraFacingMode,
  preferredDeviceId?: string
): Promise<MediaStream> {
  const fallbacks = getCameraConstraintFallbacks(facingMode, preferredDeviceId);
  let lastError: unknown = null;

  for (const constraints of fallbacks) {
    try {
      return await getUserMediaFn(constraints);
    } catch (err: unknown) {
      lastError = err;
      const errName = (err as { name?: string })?.name || '';
      // If the user or browser explicitly denied permission, do not re-prompt multiple times in a row
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errName === 'SecurityError'
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Unable to start camera stream');
}

/**
 * Classifies a getUserMedia error into a user-friendly diagnosis with guidance on enabling the popup.
 */
export function diagnoseCameraError(err: unknown): CameraErrorDiagnosis {
  const errorObj = (err || {}) as { name?: string; message?: string };
  const name = errorObj.name || '';
  const rawMessage = errorObj.message || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return {
      kind: 'permission_denied',
      title: 'Enable Camera Access',
      message:
        'Your browser or preview frame requires permission to access your physical camera.',
      browserHint:
        'If the browser permission popup does not appear when clicking "Allow Camera Access", tap the Lock / Tune icon in your address bar and set Camera to Allow — or use Phone Camera / Live Studio Camera below.',
      canRetryPopup: true
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      kind: 'no_device',
      title: 'No Physical Webcam Found',
      message:
        'No hardware camera was detected on this device. Live Studio Camera has been enabled so you can shoot right away.',
      browserHint:
        'Connect a webcam and click "Allow Camera Access", or use Phone Camera / Upload Photos.',
      canRetryPopup: true
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      kind: 'in_use',
      title: 'Camera Busy in Another App',
      message:
        'Your physical camera is currently in use by another application or browser tab.',
      browserHint:
        'Close other apps using the camera and click "Allow Camera Access", or continue with Live Studio Camera.',
      canRetryPopup: true
    };
  }

  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return {
      kind: 'overconstrained',
      title: 'Camera Resolution Adjusted',
      message: 'Tap "Allow Camera Access" to retry with universal mobile camera settings.',
      browserHint: 'Standard resolution mode will be used automatically.',
      canRetryPopup: true
    };
  }

  return {
    kind: 'unknown',
    title: 'Enable Camera Access',
    message:
      rawMessage ||
      'Grant browser permission to use your physical camera, or shoot immediately with the Live Studio Camera.',
    browserHint:
      'You can also open your native Phone Camera or upload photos from your gallery.',
    canRetryPopup: true
  };
}

