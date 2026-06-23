import type { Board, Component } from './engine';
import { validateFlow, type DiagnosticFlow } from './diagnostics';

import speedybeeF405V4 from '@/data/boards/speedybee-f405-v4.json';
import speedybeeF405V3 from '@/data/boards/speedybee-f405-v3.json';
import speedybeeF405Mini from '@/data/boards/speedybee-f405-mini.json';
import speedybeeF7V3 from '@/data/boards/speedybee-f7-v3.json';
import matekF405TE from '@/data/boards/matek-f405-te.json';
import matekF722SE from '@/data/boards/matek-f722-se.json';
import matekH743Slim from '@/data/boards/matek-h743-slim.json';
import jhemcuGhf405aio from '@/data/boards/jhemcu-ghf405aio.json';
import jhemcuGf16 from '@/data/boards/jhemcu-gf16-aio.json';
import geprcTakerF405 from '@/data/boards/geprc-taker-f405.json';
import geprcTakerF722 from '@/data/boards/geprc-taker-f722.json';
import iflightBlitzF405 from '@/data/boards/iflight-blitz-f405.json';
import iflightBlitzF722 from '@/data/boards/iflight-blitz-f722.json';
import diatoneMambaF405Mk4 from '@/data/boards/diatone-mamba-f405-mk4.json';
import foxeerF722V4 from '@/data/boards/foxeer-f722-v4.json';
import matekF405Wing from '@/data/boards/matek-f405-wing.json';

import noVideo from '@/data/flows/no-video.json';
import noRxLink from '@/data/flows/no-rx-link.json';
import noArm from '@/data/flows/no-arm.json';
import motorNoSpin from '@/data/flows/motor-no-spin.json';
import noConnect from '@/data/flows/no-connect.json';
import noGpsFix from '@/data/flows/no-gps-fix.json';
import driftToilet from '@/data/flows/drift-toilet.json';
import overheat from '@/data/flows/overheat.json';
import noOsd from '@/data/flows/no-osd.json';
import noTelemetry from '@/data/flows/no-telemetry.json';
import voltageSag from '@/data/flows/voltage-sag.json';
import escDesync from '@/data/flows/esc-desync.json';
import rebootInflight from '@/data/flows/reboot-inflight.json';
import linkJamming from '@/data/flows/link-loss-jamming.json';
import fiberNoSignal from '@/data/flows/fiber-no-signal.json';
import dropRelease from '@/data/flows/drop-release.json';
import gpsRescue from '@/data/flows/gps-rescue.json';
import smokeShort from '@/data/flows/smoke-short.json';
import gyroCalibration from '@/data/flows/gyro-calibration.json';
import osdFont from '@/data/flows/osd-font.json';
import saveFailed from '@/data/flows/save-failed.json';
import channelMap from '@/data/flows/channel-map.json';
import flipTakeoff from '@/data/flows/flip-takeoff.json';

import rp3 from '@/data/components/radiomaster-rp3-elrs.json';
import ep2 from '@/data/components/happymodel-ep2-elrs.json';
import rp1 from '@/data/components/radiomaster-rp1-elrs.json';
import betafpvElrs from '@/data/components/betafpv-elrs-lite.json';
import o3 from '@/data/components/dji-o3-air-unit.json';
import walksnail from '@/data/components/walksnail-avatar-hd.json';
import hdzero from '@/data/components/hdzero-freestyle-v2.json';
import tankSolo from '@/data/components/rush-tank-solo.json';
import m10q from '@/data/components/matek-m10q-5883.json';
import escBlheliS from '@/data/components/generic-blheli-s-4in1.json';
import escBlheli32 from '@/data/components/generic-blheli32-4in1.json';
import escAm32 from '@/data/components/generic-am32-4in1.json';
import releaseServo from '@/data/components/generic-servo-release.json';
import releaseMagnet from '@/data/components/generic-electromagnet-release.json';

export const BOARDS = [
  speedybeeF405V4,
  speedybeeF405V3,
  speedybeeF405Mini,
  speedybeeF7V3,
  matekF405TE,
  matekF722SE,
  matekH743Slim,
  jhemcuGhf405aio,
  jhemcuGf16,
  geprcTakerF405,
  geprcTakerF722,
  iflightBlitzF405,
  iflightBlitzF722,
  diatoneMambaF405Mk4,
  foxeerF722V4,
  matekF405Wing,
] as Board[];

export const COMPONENTS = [
  rp3,
  ep2,
  rp1,
  betafpvElrs,
  o3,
  walksnail,
  hdzero,
  tankSolo,
  m10q,
  escBlheliS,
  escBlheli32,
  escAm32,
  releaseServo,
  releaseMagnet,
] as Component[];

export const RECEIVERS = COMPONENTS.filter((c) => c.type === 'receiver');
export const VTXS = COMPONENTS.filter((c) => c.type === 'vtx_digital' || c.type === 'vtx_analog');
export const GPSES = COMPONENTS.filter((c) => c.type === 'gps');
export const ESCS = COMPONENTS.filter((c) => c.type === 'esc');
export const RELEASES = COMPONENTS.filter((c) => c.type === 'release');

export const FLOWS = [
  noVideo,
  noRxLink,
  noArm,
  motorNoSpin,
  noConnect,
  noGpsFix,
  driftToilet,
  overheat,
  noOsd,
  noTelemetry,
  voltageSag,
  escDesync,
  rebootInflight,
  linkJamming,
  fiberNoSignal,
  dropRelease,
  gpsRescue,
  smokeShort,
  gyroCalibration,
  osdFont,
  saveFailed,
  channelMap,
  flipTakeoff,
] as DiagnosticFlow[];

// Дев-перевірка цілісності дерев: биті next/відсутні source ловимо до деплою,
// а не білим екраном у полі.
if (process.env.NODE_ENV !== 'production') {
  for (const flow of FLOWS) {
    const errors = validateFlow(flow);
    if (errors.length) {
      // eslint-disable-next-line no-console
      console.warn(`[FTOS] дерево "${flow.id}" має проблеми:`, errors);
    }
  }
}
